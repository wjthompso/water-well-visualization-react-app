import {
    Camera,
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    CesiumTerrainProvider,
    Viewer as CesiumViewer,
    createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CesiumComponentRef, Viewer } from "resium";
import "../../App.css";
import CustomSearchBar from "../Searchbar/CustomSearchbar";
import DraggableComponent from "../testDraggableComponent/ExampleDraggableComponent";
import CylinderEntities from "./CylinderEntities";
import Tooltip from "./Tooltip";

interface Chunk {
    topLeft: {
        lat: number;
        lon: number;
    };
    bottomRight: {
        lat: number;
        lon: number;
    };
}

const fetchQuadrants = async (): Promise<Chunk[]> => {
    const response = await fetch("http://localhost:3000/keys");
    const data: string[] = await response.json();
    return data.map((entry: string) => {
        const match = entry.match(
            /location:\(([^,]+), ([^,]+)\)-\(([^,]+), ([^,]+)\)/
        );

        if (!match) {
            throw new Error("Invalid quadrant entry: " + entry);
        }

        return {
            topLeft: {
                lat: parseFloat(match[1]),
                lon: parseFloat(match[2]),
            },
            bottomRight: {
                lat: parseFloat(match[3]),
                lon: parseFloat(match[4]),
            },
        };
    });
};

function moveCameraToDangermond(viewer: CesiumViewer) {
    const cameraLongitude = -120.432283;
    const cameraLatitude = 34.454167;
    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(
            cameraLongitude,
            cameraLatitude,
            5000
        ),
        orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-60),
            roll: 0.0,
        },
    });
}

function enableUndergroundView(viewer: CesiumViewer) {
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
}

function makeGroundTranslucentAsYouGetCloser(viewer: CesiumViewer) {
    const globe = viewer.scene.globe;
    globe.depthTestAgainstTerrain = true;
    globe.translucency.enabled = true;
    const scene = viewer.scene;
    scene.camera.changed.addEventListener(function () {
        const cameraHeight = scene.camera.positionCartographic.height;
        if (cameraHeight < 700) {
            globe.translucency.frontFaceAlpha = 0.5;
        } else {
            globe.translucency.frontFaceAlpha = 1;
        }
    });
}

const ResiumViewerComponent: React.FC = () => {
    const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const [quadrants, setQuadrants] = useState<Chunk[]>([]);
    const [currentQuadrant, setCurrentQuadrant] = useState<Chunk | null>(null);
    const hasLoadedTerrainData = useRef(false);
    const quadrantsCache = useRef<Chunk[] | null>(null); // Cache for quadrants
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const hasFetchedQuadrants = useRef(false); // Ref to check if quadrants have been fetched

    useEffect(() => {
        const loadTerrainData = async () => {
            const terrainData = await createWorldTerrainAsync();
            setTerrainProvider(terrainData);
            hasLoadedTerrainData.current = true;
        };

        const getQuadrants = async () => {
            if (!hasFetchedQuadrants.current) {
                // Assume (dangerously) that the quadrants WILL be fetched
                // do this so that when useEffect gets called again we don't
                // make an unnecessary second call to the API.
                hasFetchedQuadrants.current = true;
                const quadrantData: Chunk[] = await fetchQuadrants();
                quadrantsCache.current = quadrantData;
                setQuadrants(quadrantData);
            } else {
                setQuadrants(quadrantsCache.current || []);
            }
        };

        loadTerrainData();
        getQuadrants();

        const repositionToolbar = () => {
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement as CesiumViewer;
                const container = viewer.container;
                const toolbar = container.querySelector<HTMLDivElement>(
                    ".cesium-viewer-toolbar"
                );

                if (toolbar) {
                    toolbar.style.top = "2.5rem";
                    if (window.innerWidth < 768) {
                        toolbar.style.left = "20rem";
                        toolbar.style.right = "auto";
                    } else {
                        toolbar.style.left = "20rem";
                        toolbar.style.right = "auto";
                    }
                }
            }
        };

        const checkViewerReady = setInterval(() => {
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement as CesiumViewer;
                clearInterval(checkViewerReady);
                enableUndergroundView(viewer);
                moveCameraToDangermond(viewer);
                makeGroundTranslucentAsYouGetCloser(viewer);
                repositionToolbar();
            }
        }, 100);

        window.addEventListener("resize", repositionToolbar);

        return () => {
            clearInterval(checkViewerReady);
            window.removeEventListener("resize", repositionToolbar);
        };
    }, []);

    const handleCameraMove = useCallback(
        (camera: Camera) => {
            const cartographicPosition = Cartographic.fromCartesian(
                camera.position
            );
            const currentLat = CesiumMath.toDegrees(
                cartographicPosition.latitude
            );
            const currentLon = CesiumMath.toDegrees(
                cartographicPosition.longitude
            );

            const newQuadrant = quadrants.find(
                ({ topLeft, bottomRight }) =>
                    currentLat >= bottomRight.lat &&
                    currentLat <= topLeft.lat &&
                    currentLon >= topLeft.lon &&
                    currentLon <= bottomRight.lon
            );

            if (newQuadrant && newQuadrant !== currentQuadrant) {
                setCurrentQuadrant(newQuadrant);
                console.log("Entered new quadrant:", newQuadrant);
            }
        },
        [quadrants, currentQuadrant]
    );

    useEffect(() => {
        if (viewerRef.current?.cesiumElement) {
            const viewer = viewerRef.current.cesiumElement as CesiumViewer;
            const scene = viewer.scene;
            const camera = scene.camera;

            const moveHandler = () => handleCameraMove(camera);

            scene.postRender.addEventListener(moveHandler);

            return () => {
                scene.postRender.removeEventListener(moveHandler);
            };
        }
    }, [handleCameraMove]);

    if (!terrainProvider) {
        return <div>Loading terrain data...</div>;
    }

    return (
        <div
            id="cesium-viewer-plus-widgets"
            className="relative box-border w-[100vw] h-full p-0 m-0 overflow-hidden"
            ref={parentRefForDraggableComponent}
        >
            <CustomSearchBar
                viewerRef={viewerRef}
                searchBarRef={searchBarRef}
            />
            <DraggableComponent
                parentRef={parentRefForDraggableComponent}
                searchBarRef={searchBarRef}
            />{" "}
            <div
                id="cesium-viewer-container"
                className="relative w-[100%] h-[100%] overflow-hidden"
            >
                <Viewer
                    full
                    ref={viewerRef}
                    terrainProvider={terrainProvider}
                    orderIndependentTranslucency={false}
                    fullscreenButton={false}
                    animation={false}
                    timeline={false}
                    navigationHelpButton={false} // Hide the navigation help button
                    homeButton={false} // Hide the home button
                    sceneModePicker={false} // Hide the scene mode picker
                    baseLayerPicker={true} // Hide the base layer picker
                    geocoder={false} // Hide the geocoder
                >
                    <CylinderEntities terrainProvider={terrainProvider} />
                </Viewer>
                <Tooltip />
            </div>
            {/* Ensure the DraggableComponent is outside the Cesium viewer container */}
        </div>
    );
};

export default ResiumViewerComponent;
