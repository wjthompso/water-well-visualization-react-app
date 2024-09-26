// ResiumViewerComponent.tsx
import {
    Camera,
    Cartesian3,
    Cartographic,
    Color as CesiumColor,
    Math as CesiumMath,
    CesiumTerrainProvider,
    Viewer as CesiumViewer,
    createWorldTerrainAsync,
    IonImageryProvider,
    ScreenSpaceEventType,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { CesiumComponentRef, Viewer } from "resium";
import "../../App.css";
import { TooltipContext } from "../../context/AppContext";
import {
    GroundMaterialType,
    GroundMaterialTypeColor,
    Layer,
    WellData,
} from "../../context/WellData";
import DraggableComponent from "../DraggableFooter/DraggableFooter";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CustomSearchBar from "../Searchbar/CustomSearchbar";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent"; // Import the component
import Tooltip from "./Tooltip";
import CylinderEntities from "./WaterWells";

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
    const response = await fetch(
        "https://waterwelldepthmap.bren.ucsb.edu/api/keys"
    );
    const chunks: Chunk[] = await response.json();
    return chunks;
};

const fetchWellData = async (locationKey: string): Promise<RawWellData[]> => {
    const response = await fetch(
        "https://waterwelldepthmap.bren.ucsb.edu/api/keys",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: locationKey }),
        }
    );
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
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
}

function makeGroundTranslucentAsYouGetCloser(viewer: CesiumViewer) {
    const globe = viewer.scene.globe;
    globe.depthTestAgainstTerrain = true;
    globe.translucency.enabled = true;
    const scene = viewer.scene;

    // Define a handler function
    const handleCameraChange = () => {
        const cameraCartographic = Cartographic.fromCartesian(
            scene.camera.position
        );

        // Get the terrain height relative to the globe at the camera's position
        const terrainHeight = globe.getHeight(cameraCartographic);

        // If terrainHeight is undefined (i.e., not fully loaded), assume sea level (0)
        const terrainElevation =
            terrainHeight !== undefined ? terrainHeight : 0;

        // Calculate the camera height above the terrain
        const cameraHeightAboveTerrain =
            cameraCartographic.height - terrainElevation;

        // Adjust the globe's translucency based on height above the terrain
        if (cameraHeightAboveTerrain < 500) {
            globe.translucency.frontFaceAlpha = 0.2;
        } else if (cameraHeightAboveTerrain < 2000) {
            globe.translucency.frontFaceAlpha = 0.5;
        } else {
            globe.translucency.frontFaceAlpha = 1;
        }
    };

    // Add event listener for when the camera changes
    scene.camera.changed.addEventListener(handleCameraChange);

    // Optional: Initialize the translucency based on the current camera position
    handleCameraChange();

    // Cleanup function to remove the event listener when no longer needed
    return () => {
        scene.camera.changed.removeEventListener(handleCameraChange);
    };
}

function decreaseLevelOfDetail(viewer: CesiumViewer) {
    // viewer.scene.globe.maximumScreenSpaceError = 3;
    console.log(
        "Decreasing level of detail",
        viewer.scene.globe.maximumScreenSpaceError
    );
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
    // Grid parameters
    const minLat = 24.536111;
    const maxLat = 49.36843957;
    const minLon = -124.592902859999;
    const maxLon = -67.4433;
    const chunkSplitN = 119;

    const latStep = (maxLat - minLat) / chunkSplitN;
    const lonStep = (maxLon - minLon) / chunkSplitN;

    const roundToSix = (num: number) => Math.round(num * 1e6) / 1e6;

    const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const quadrantsRef = useRef<Chunk[]>([]); // Use ref for quadrants
    const quadrantsMapRef = useRef<Map<string, Chunk>>(new Map());
    const currentQuadrantRef = useRef<Chunk | null | undefined>(null);
    const [currentQuadrant, setCurrentQuadrant] = useState<
        Chunk | null | undefined
    >(null);
    const [
        wellDataWithoutElevationAdjustments,
        setWellDataWithoutElevationAdjustments,
    ] = useState<WellData[]>([]); // State to store well data without elevation adjustments
    const [finishedLoading, setFinishedLoading] = useState<boolean>(false);
    const hasLoadedTerrainData = useRef(false);
    const hasFetchedQuadrants = useRef(false); // Ref to check if quadrants have been fetched
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const [showWells, setShowWells] = useState(true);
    const showWellsRef = useRef(true);
    // Variables to store the previous camera position
    const prevCameraPosition = useRef<Cartographic | null>(null);
    const thresholdHeight = 1609.34 * 50; // 50 miles in meters
    const { setTooltipString } = useContext(TooltipContext);

    // Update showWellsRef whenever showWells changes
    useEffect(() => {
        showWellsRef.current = showWells;
    }, [showWells]);

    const calculateChunkKey = (
        lat: number,
        lon: number
    ): { chunkKey: string; chunk: Chunk } => {
        let latIndex = Math.floor((lat - minLat) / latStep);
        let lonIndex = Math.floor((lon - minLon) / lonStep);

        // Correct indices if on the boundary
        if (latIndex >= chunkSplitN) latIndex = chunkSplitN - 1;
        if (latIndex < 0) latIndex = 0;
        if (lonIndex >= chunkSplitN) lonIndex = chunkSplitN - 1;
        if (lonIndex < 0) lonIndex = 0;

        const topLeftLat = roundToSix(minLat + latIndex * latStep);
        const topLeftLon = roundToSix(minLon + lonIndex * lonStep);
        const bottomRightLat = roundToSix(minLat + (latIndex + 1) * latStep);
        const bottomRightLon = roundToSix(minLon + (lonIndex + 1) * lonStep);

        const chunkKey = `${topLeftLat},${topLeftLon}-${bottomRightLat},${bottomRightLon}`;

        const chunk: Chunk = {
            topLeft: { lat: topLeftLat, lon: topLeftLon },
            bottomRight: { lat: bottomRightLat, lon: bottomRightLon },
        };

        return { chunkKey, chunk };
    };

    const handleCameraMove = useCallback(async (camera: Camera) => {
        const cartographicPosition = Cartographic.fromCartesian(
            camera.position
        );
        const currentLat = Number(
            CesiumMath.toDegrees(cartographicPosition.latitude).toFixed(6)
        );
        const currentLon = Number(
            CesiumMath.toDegrees(cartographicPosition.longitude).toFixed(6)
        );

        const quadrant = currentQuadrantRef.current;
        // Check if the camera is still within the current chunk
        if (
            quadrant &&
            currentLat >= quadrant.topLeft.lat &&
            currentLat <= quadrant.bottomRight.lat &&
            currentLon >= quadrant.topLeft.lon &&
            currentLon <= quadrant.bottomRight.lon
        ) {
            return;
        }

        // Calculate the chunkKey for the current position
        const { chunkKey, chunk } = calculateChunkKey(currentLat, currentLon);
        const calculatedCurrentChunk = chunk;

        // Check if the chunkKey exists in quadrantsMapRef
        if (quadrantsMapRef.current.has(chunkKey)) {
            // Retrieve the exact chunk from quadrantsMapRef
            const chunk = quadrantsMapRef.current.get(chunkKey);

            if (chunk) {
                // Proceed to fetch data for this chunk using the exact chunk
                const locationKey = createLocationKey(chunk);
                const rawWellData = await fetchWellData(locationKey);
                const processedWellData = processRawWellData(rawWellData);
                const filledWellData = fillInMissingLayers(processedWellData);
                setWellDataWithoutElevationAdjustments(filledWellData);
                setCurrentQuadrant(chunk);
                currentQuadrantRef.current = chunk;
            } else {
                console.log(
                    "Chunk not found in quadrantsMapRef, although it's key is valid, this should not happen."
                );
            }
        } else {
            // Optionally, set currentQuadrant to null
            setCurrentQuadrant(calculatedCurrentChunk);
            setWellDataWithoutElevationAdjustments([]);
            currentQuadrantRef.current = calculatedCurrentChunk;
        }

        // Update the previous position
        prevCameraPosition.current = cartographicPosition;
    }, []);

    useEffect(() => {
        const loadTerrainData = async () => {
            const terrainData = await createWorldTerrainAsync({
                requestWaterMask: false,
                requestVertexNormals: false,
            });
            setTerrainProvider(terrainData);
            hasLoadedTerrainData.current = true;
        };

        const getQuadrants = async () => {
            if (!hasFetchedQuadrants.current) {
                hasFetchedQuadrants.current = true;
                const quadrantData: Chunk[] = await fetchQuadrants();
                quadrantsRef.current = quadrantData;

                // Create a Map of chunkKeys to chunks
                quadrantsMapRef.current = new Map(
                    quadrantData.map((chunk) => {
                        const topLeftLat = roundToSix(chunk.topLeft.lat);
                        const topLeftLon = roundToSix(chunk.topLeft.lon);
                        const bottomRightLat = roundToSix(
                            chunk.bottomRight.lat
                        );
                        const bottomRightLon = roundToSix(
                            chunk.bottomRight.lon
                        );
                        const chunkKey = `${topLeftLat},${topLeftLon}-${bottomRightLat},${bottomRightLon}`;

                        return [chunkKey, chunk];
                    })
                );
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
                        toolbar.style.left = "-5rem";
                        toolbar.style.right = "auto";
                    } else {
                        toolbar.style.left = "-5rem";
                        toolbar.style.right = "auto";
                    }
                }
            }
        };

        const checkViewerReady = setInterval(async () => {
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement as CesiumViewer;
                clearInterval(checkViewerReady);

                viewer.imageryLayers.removeAll();

                // Add Bing Maps Aerial with Labels
                const imageryProvider = await IonImageryProvider.fromAssetId(3);
                viewer.imageryLayers.addImageryProvider(imageryProvider);

                enableUndergroundView(viewer);
                moveCameraToDangermond(viewer);
                makeGroundTranslucentAsYouGetCloser(viewer);
                decreaseLevelOfDetail(viewer);
                repositionToolbar();

                // **Disable Cesium's default double-click behavior**
                viewer.screenSpaceEventHandler.removeInputAction(
                    ScreenSpaceEventType.LEFT_DOUBLE_CLICK
                );

                const scene = viewer.scene;
                const camera = scene.camera;

                const moveHandler = () => handleCameraMove(camera);

                // Add the camera height handler using camera.changed
                const cameraHeightHandler = () => {
                    const cameraHeight =
                        scene.camera.positionCartographic.height;
                    const newShowWells = cameraHeight <= thresholdHeight;
                    if (showWellsRef.current !== newShowWells) {
                        setShowWells(newShowWells);
                        showWellsRef.current = newShowWells;

                        if (!newShowWells) {
                            setTooltipString("");
                        }
                    }
                };

                // Attach the handlers
                scene.camera.moveEnd.addEventListener(moveHandler);
                scene.camera.moveEnd.addEventListener(cameraHeightHandler);

                setFinishedLoading(true);

                return () => {
                    scene.camera.moveEnd.removeEventListener(moveHandler);
                    scene.camera.moveEnd.removeEventListener(
                        cameraHeightHandler
                    );
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

    // Compute positions for the chunk outline
    const chunkOutlinePositions = useMemo(() => {
        if (!currentQuadrant) return null;
        const { topLeft, bottomRight } = currentQuadrant;

        // Define the other two corners
        const topRight = { lat: topLeft.lat, lon: bottomRight.lon };
        const bottomLeft = { lat: bottomRight.lat, lon: topLeft.lon };

        // Create positions forming a rectangle (closed loop)
        const positions = [
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
            Cartesian3.fromDegrees(topRight.lon, topRight.lat),
            Cartesian3.fromDegrees(bottomRight.lon, bottomRight.lat),
            Cartesian3.fromDegrees(bottomLeft.lon, bottomLeft.lat),
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat), // Close the loop
        ];
        return positions;
    }, [currentQuadrant]);

    // This is here so that we actually pass a non-null terrainProvider to CylinderEntities
    if (!terrainProvider) {
        return (
            <div className="flex items-center justify-center w-full h-full md:pr-[272px] bg-headerBackgroundColor z-50">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div
            id="cesium-viewer-plus-widgets"
            className="relative box-border w-[100vw] h-full p-0 m-0 overflow-hidden"
            ref={parentRefForDraggableComponent}
        >
            {!terrainProvider || !finishedLoading ? (
                <div className="flex items-center justify-center w-full h-full md:pr-[272px] bg-headerBackgroundColor z-[100]">
                    <LoadingSpinner />
                </div>
            ) : null}
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
                    baseLayerPicker={true} // Hide the base layer picker
                    geocoder={false} // Hide the geocoder
                    selectionIndicator={false} // Hide the selection indicator
                    infoBox={false} // Hide the info box
                >
                    {/* Conditionally render wells based on camera height & whether or not we have wells to render */}
                    {showWells &&
                        wellDataWithoutElevationAdjustments.length > 0 && (
                            <CylinderEntities
                                terrainProvider={terrainProvider}
                                wellDataWithoutElevationAdjustments={
                                    wellDataWithoutElevationAdjustments
                                }
                                viewerRef={viewerRef}
                            />
                        )}

                    {/* Conditionally render the chunk boundary */}
                    {chunkOutlinePositions && showWells && (
                        <GroundPolylinePrimitiveComponent
                            positions={chunkOutlinePositions}
                            width={2.0}
                            color={CesiumColor.WHITE}
                        />
                    )}
                </Viewer>
                <Tooltip />
            </div>
            {/* Ensure the DraggableComponent is outside the Cesium viewer container */}
        </div>
    );
};

export default ResiumViewerComponent;
