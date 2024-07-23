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

interface WellData {
    // Define the structure of your WellData here
}

const fetchQuadrants = async (): Promise<Chunk[]> => {
    const response = await fetch("http://localhost:3000/keys");
    const chunks: Chunk[] = await response.json();

    return chunks;
};

const fetchWellData = async (locationKey: string): Promise<WellData> => {
    const response = await fetch("http://localhost:3000/keys", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: locationKey }),
    });
    const wellData: WellData = await response.json();

    return wellData;
};

function createLocationKey(chunk: Chunk) {
    const { topLeft, bottomRight } = chunk;
    return `location:(${topLeft.lat}, ${topLeft.lon})-(${bottomRight.lat}, ${bottomRight.lon})`;
}

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
    const quadrantsRef = useRef<Chunk[]>([]); // Use ref for quadrants
    const [currentQuadrant, setCurrentQuadrant] = useState<Chunk | null>(null);
    const [wellData, setWellData] = useState<WellData | null>(null); // State to store well data
    const hasLoadedTerrainData = useRef(false);
    const hasFetchedQuadrants = useRef(false); // Ref to check if quadrants have been fetched
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);

    // Variables to store the previous camera position
    const prevCameraPosition = useRef<Cartographic | null>(null);

    // 1. Load terrain data
    // 2. Fetch quadrants
    // 3. Set the current quadrant based on the current camera position
    // 4. Define function to reposition the toolbar when the screen gets smaller
    // 5. Set the initial camera position to Dangermond
    // 6. Enable underground view
    // 7. Make ground translucent as you get closer
    // 8. Add event listener to reposition the toolbar when the screen gets smaller
    // 9. Add the event listener to handle camera move changes
    useEffect(() => {
        const loadTerrainData = async () => {
            const terrainData = await createWorldTerrainAsync();
            setTerrainProvider(terrainData);
            hasLoadedTerrainData.current = true;
        };

        const getQuadrants = async () => {
            if (!hasFetchedQuadrants.current) {
                hasFetchedQuadrants.current = true;
                const quadrantData: Chunk[] = await fetchQuadrants();
                quadrantsRef.current = quadrantData;
                console.log("Quadrants fetched:", quadrantData);
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

                const scene = viewer.scene;
                const camera = scene.camera;

                const moveHandler = () => handleCameraMove(camera);

                scene.camera.changed.addEventListener(moveHandler);

                return () => {
                    scene.camera.changed.removeEventListener(moveHandler);
                };
            }
        }, 100);

        window.addEventListener("resize", repositionToolbar);

        return () => {
            clearInterval(checkViewerReady);
            window.removeEventListener("resize", repositionToolbar);
        };
    }, []);

    const handleCameraMove = useCallback(
        async (camera: Camera) => {
            const cartographicPosition = Cartographic.fromCartesian(
                camera.position
            );
            const currentLat = CesiumMath.toDegrees(
                cartographicPosition.latitude
            );
            const currentLon = CesiumMath.toDegrees(
                cartographicPosition.longitude
            );

            // Find the chunk that contains the current camera position and its index
            let currentChunkIndex = -1;
            const currentChunk = quadrantsRef.current.find((chunk, index) => {
                if (
                    currentLon >= chunk.topLeft.lon &&
                    currentLon <= chunk.bottomRight.lon &&
                    currentLat <= chunk.bottomRight.lat &&
                    currentLat >= chunk.topLeft.lat
                ) {
                    currentChunkIndex = index;
                    return true;
                }
                return false;
            });

            console.log("chunks", quadrantsRef.current);
            console.log("Current camera position:", currentLat, currentLon);
            console.log("Current chunk:", currentChunk);
            console.log("currentChunkIndex", currentChunkIndex);

            if (currentChunk) {
                console.log("Current chunk:", currentChunk);
                console.log("Current chunk index:", currentChunkIndex);
                const locationKey = createLocationKey(currentChunk);
                const wellData = await fetchWellData(locationKey);
                setWellData(wellData);
                console.log("Fetched well data:", wellData);
            } else {
                console.log("Camera is not in any chunk");
            }

            setCurrentQuadrant(currentChunk);

            // Update the previous position
            prevCameraPosition.current = cartographicPosition;
        },
        [setCurrentQuadrant]
    );

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
