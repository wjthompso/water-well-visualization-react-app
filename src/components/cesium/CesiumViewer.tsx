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
import {
    GroundMaterialType,
    GroundMaterialTypeColor,
    Layer,
    WellData,
} from "../../context/WellData";
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

interface RawLayer {
    0: number; // startDepth
    1: number; // endDepth
    2: string; // description
    3: string; // type
    4: number; // value1
    5: number; // value2
    6: number; // value3
    7: number; // value4
}

interface RawWellData {
    lat: number;
    lon: number;
    total_well_depth_in_ft: number;
    well_id: string;
    layers: RawLayer[];
}

const fetchQuadrants = async (): Promise<Chunk[]> => {
    const response = await fetch("http://localhost:3000/keys");
    const chunks: Chunk[] = await response.json();
    return chunks;
};

const fetchWellData = async (locationKey: string): Promise<RawWellData[]> => {
    const response = await fetch("http://localhost:3000/keys", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: locationKey }),
    });
    const wellData: RawWellData[] = await response.json();
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

function mapMaterialType(material: string): keyof typeof GroundMaterialType {
    const cleanedMaterial = material.trim().toUpperCase();
    for (const key in GroundMaterialType) {
        if (key === cleanedMaterial) {
            return key as keyof typeof GroundMaterialType;
        }
    }
    return "NA";
}

function mapMaterialColor(
    materialKey: keyof typeof GroundMaterialType
): GroundMaterialTypeColor {
    if (materialKey in GroundMaterialTypeColor) {
        return GroundMaterialTypeColor[materialKey];
    } else {
        return GroundMaterialTypeColor.NA; // Fallback if material not found
    }
}

function processRawWellData(rawData: RawWellData[]): WellData[] {
    return rawData.map((data) => {
        const layers: Layer[] = data.layers.map((layer: RawLayer) => {
            const materialType: keyof typeof GroundMaterialType =
                mapMaterialType(layer[3]);
            const color: GroundMaterialTypeColor =
                mapMaterialColor(materialType);

            return {
                type: [GroundMaterialType[materialType]],
                color: color,
                startDepth: layer[0],
                endDepth: layer[1],
                unAdjustedEndDepth: layer[1],
                unAdjustedStartDepth: layer[0],
                description: layer[2],
            };
        });

        return {
            longitude: data.lon,
            latitude: data.lat,
            startDepth: 0,
            endDepth: data.total_well_depth_in_ft,
            StateWellID: data.well_id,
            layers: layers,
        };
    });
}

function fillInMissingLayers(wellData: WellData[]): WellData[] {
    return wellData.map((well) => {
        const filledLayers: Layer[] = [];
        let currentDepth = well.startDepth;

        well.layers.forEach((layer) => {
            // If there's a gap between the current depth and the start of the next layer, fill it with an NA layer
            if (layer.startDepth > currentDepth) {
                filledLayers.push({
                    type: [GroundMaterialType.NA],
                    color: GroundMaterialTypeColor.NA,
                    startDepth: currentDepth,
                    endDepth: layer.startDepth,
                    unAdjustedEndDepth: layer.startDepth,
                    unAdjustedStartDepth: currentDepth,
                    description: "NA",
                });
            }

            // Add the current layer
            filledLayers.push(layer);

            // Update the current depth to the end of this layer
            currentDepth = layer.endDepth;
        });

        // If there's a gap between the end of the last layer and the end of the well, fill it with an NA layer
        if (currentDepth < well.endDepth) {
            filledLayers.push({
                type: [GroundMaterialType.NA],
                color: GroundMaterialTypeColor.NA,
                startDepth: currentDepth,
                endDepth: well.endDepth,
                unAdjustedEndDepth: well.endDepth,
                unAdjustedStartDepth: currentDepth,
                description: "NA",
            });
        }

        return {
            ...well,
            layers: filledLayers,
        };
    });
}

const ResiumViewerComponent: React.FC = () => {
    const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const quadrantsRef = useRef<Chunk[]>([]); // Use ref for quadrants
    const currentQuadrantRef = useRef<Chunk | null | undefined>(null);
    const [currentQuadrant, setCurrentQuadrant] = useState<
        Chunk | null | undefined
    >(null);
    const [
        wellDataWithoutElevationAdjustments,
        setWellDataWithoutElevationAdjustments,
    ] = useState<WellData[]>([]); // State to store well data without elevation adjustments
    const hasLoadedTerrainData = useRef(false);
    const hasFetchedQuadrants = useRef(false); // Ref to check if quadrants have been fetched
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);

    // Variables to store the previous camera position
    const prevCameraPosition = useRef<Cartographic | null>(null);

    const handleCameraMove = useCallback(async (camera: Camera) => {
        const cartographicPosition = Cartographic.fromCartesian(
            camera.position
        );
        const currentLat = CesiumMath.toDegrees(cartographicPosition.latitude);
        const currentLon = CesiumMath.toDegrees(cartographicPosition.longitude);

        const quadrant = currentQuadrantRef.current;

        // Check if the camera is still within the current chunk
        if (
            quadrant &&
            currentLon >= quadrant.topLeft.lon &&
            currentLon <= quadrant.bottomRight.lon &&
            currentLat <= quadrant.bottomRight.lat &&
            currentLat >= quadrant.topLeft.lat
        ) {
            // The camera is still within the current chunk, no need to do anything
            console.log(
                "We correctly determined that we're in the same chunk as before"
            );
            return;
        }

        // Find the new chunk that contains the current camera position
        console.log("We're about to do an expensive operation");
        const newChunk = quadrantsRef.current.find((chunk) => {
            return (
                currentLon >= chunk.topLeft.lon &&
                currentLon <= chunk.bottomRight.lon &&
                currentLat <= chunk.bottomRight.lat &&
                currentLat >= chunk.topLeft.lat
            );
        });

        if (newChunk && newChunk !== quadrant) {
            // We have moved to a new chunk, fetch the new data
            const locationKey: string = createLocationKey(newChunk);
            const rawWellData: RawWellData[] = await fetchWellData(locationKey);
            const processedWellData: WellData[] =
                processRawWellData(rawWellData);
            const filledWellData: WellData[] =
                fillInMissingLayers(processedWellData);
            setWellDataWithoutElevationAdjustments(filledWellData);
            setCurrentQuadrant(newChunk);
            currentQuadrantRef.current = newChunk;
        }

        // Update the previous position
        prevCameraPosition.current = cartographicPosition;
    }, []);

    useEffect(() => {
        currentQuadrantRef.current = currentQuadrant;
    }, [currentQuadrant]);

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
                        toolbar.style.left = "2.5rem";
                        toolbar.style.right = "auto";
                    } else {
                        toolbar.style.left = "2.5rem";
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            />
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
                    baseLayerPicker={false} // Hide the base layer picker
                    geocoder={false} // Hide the geocoder
                >
                    <CylinderEntities
                        terrainProvider={terrainProvider}
                        wellDataWithoutElevationAdjustments={
                            wellDataWithoutElevationAdjustments
                        }
                    />
                </Viewer>
                <Tooltip />
            </div>
            {/* Ensure the DraggableComponent is outside the Cesium viewer container */}
        </div>
    );
};

export default ResiumViewerComponent;
