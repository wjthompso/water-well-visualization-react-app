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
import {
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
import CountyAggregations from "./CountyAggregations";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import StateAggregations from "./StateAggregationComponent";
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

    const handleCameraChange = () => {
        const cameraCartographic = Cartographic.fromCartesian(
            scene.camera.position
        );

        const terrainHeight = globe.getHeight(cameraCartographic);
        const terrainElevation =
            terrainHeight !== undefined ? terrainHeight : 0;
        const cameraHeightAboveTerrain =
            cameraCartographic.height - terrainElevation;

        if (cameraHeightAboveTerrain < 500) {
            viewer.scene.globe.maximumScreenSpaceError = 8;
            globe.translucency.frontFaceAlpha = 0.2;
        } else if (cameraHeightAboveTerrain < 2000) {
            viewer.scene.globe.maximumScreenSpaceError = 4;
            globe.translucency.frontFaceAlpha = 0.5;
        } else {
            viewer.scene.globe.maximumScreenSpaceError = 2;
            globe.translucency.frontFaceAlpha = 1;
        }
    };

    scene.camera.changed.addEventListener(handleCameraChange);
    handleCameraChange();

    return () => {
        scene.camera.changed.removeEventListener(handleCameraChange);
    };
}

function decreaseLevelOfDetail(viewer: CesiumViewer) {
    viewer.scene.globe.maximumScreenSpaceError = 6;
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
        return GroundMaterialTypeColor.NA;
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
            filledLayers.push(layer);
            currentDepth = layer.endDepth;
        });

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
    const minLat = 24.536111;
    const maxLat = 49.36843957;
    const minLon = -124.592902859999;
    const maxLon = -67.4433;
    const chunkSplitN = 119;
    const terrainFlatteningThreshold = 1500000; // 1,500,000 meters

    const latStep = (maxLat - minLat) / chunkSplitN;
    const lonStep = (maxLon - minLon) / chunkSplitN;

    const roundToSix = (num: number) => Math.round(num * 1e6) / 1e6;

    const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const quadrantsRef = useRef<Chunk[]>([]);
    const quadrantsMapRef = useRef<Map<string, Chunk>>(new Map());
    const currentQuadrantRef = useRef<Chunk | null | undefined>(null);
    const [currentQuadrant, setCurrentQuadrant] = useState<
        Chunk | null | undefined
    >(null);
    const [
        wellDataWithoutElevationAdjustments,
        setWellDataWithoutElevationAdjustments,
    ] = useState<WellData[]>([]);
    const [finishedLoading, setFinishedLoading] = useState<boolean>(false);
    const hasLoadedTerrainData = useRef(false);
    const hasFetchedQuadrants = useRef(false);
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const [showWells, setShowWells] = useState(true);
    const showWellsRef = useRef(true);
    const [showAggregations, setShowAggregations] = useState(true);
    const thresholdHeight = 1609.34 * 50; // Approximately 50 miles in meters
    const { setTooltipString } = useContext(TooltipContext);

    const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        showWellsRef.current = showWells;
    }, [showWells]);

    useEffect(() => {
        if (viewerRef.current?.cesiumElement) {
            const viewer = viewerRef.current.cesiumElement as CesiumViewer;
            const scene = viewer.scene;
            const camera = scene.camera;

            const handleAggregationVisibility = () => {
                const cameraCartographic = Cartographic.fromCartesian(
                    camera.position
                );
                const cameraHeight = cameraCartographic.height;
                const newShowAggregations = cameraHeight <= thresholdHeight;

                if (showAggregations !== newShowAggregations) {
                    setShowAggregations(newShowAggregations);
                }
            };

            camera.changed.addEventListener(handleAggregationVisibility);
            handleAggregationVisibility();

            return () => {
                camera.changed.removeEventListener(handleAggregationVisibility);
            };
        }
    }, [thresholdHeight, showAggregations]);

    const calculateChunkKey = (
        lat: number,
        lon: number
    ): { chunkKey: string; chunk: Chunk } => {
        let latIndex = Math.floor((lat - minLat) / latStep);
        let lonIndex = Math.floor((lon - minLon) / lonStep);

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

    const handleCameraMove = useCallback(
        async (camera: Camera) => {
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
            if (
                quadrant &&
                currentLat >= quadrant.topLeft.lat &&
                currentLat <= quadrant.bottomRight.lat &&
                currentLon >= quadrant.topLeft.lon &&
                currentLon <= quadrant.bottomRight.lon
            ) {
                return;
            }

            const { chunkKey, chunk } = calculateChunkKey(
                currentLat,
                currentLon
            );
            const calculatedCurrentChunk = chunk;

            if (quadrantsMapRef.current.has(chunkKey)) {
                const chunk = quadrantsMapRef.current.get(chunkKey);
                if (chunk) {
                    const locationKey = createLocationKey(chunk);
                    const rawWellData = await fetchWellData(locationKey);
                    const processedWellData = processRawWellData(rawWellData);
                    const filledWellData =
                        fillInMissingLayers(processedWellData);
                    setWellDataWithoutElevationAdjustments(filledWellData);
                    setCurrentQuadrant(chunk);
                    currentQuadrantRef.current = chunk;
                }
            } else {
                setCurrentQuadrant(calculatedCurrentChunk);
                setWellDataWithoutElevationAdjustments([]);
                currentQuadrantRef.current = calculatedCurrentChunk;
            }

            // Adjust terrainExaggeration based on camera height
            const cameraHeight = cartographicPosition.height;
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement as CesiumViewer;
                if (cameraHeight > terrainFlatteningThreshold) {
                    if (viewer.scene.verticalExaggeration !== 0.0) {
                        viewer.scene.verticalExaggeration = 0.0; // Flatten the terrain
                        console.log("Flattened the terrain.");
                    }
                } else {
                    if (viewer.scene.verticalExaggeration !== 1.0) {
                        viewer.scene.verticalExaggeration = 1.0; // Restore the terrain
                        console.log("Restored terrain elevation.");
                    }
                }
            }
        },
        [terrainFlatteningThreshold]
    );

    useEffect(() => {
        const loadTerrainData = async () => {
            try {
                const terrainData = await createWorldTerrainAsync({
                    requestWaterMask: false,
                    requestVertexNormals: false,
                });
                setTerrainProvider(terrainData);
                hasLoadedTerrainData.current = true;
            } catch (error) {
                console.error("Error loading terrain data:", error);
            }
        };

        const getQuadrants = async () => {
            if (!hasFetchedQuadrants.current) {
                hasFetchedQuadrants.current = true;
                try {
                    const quadrantData: Chunk[] = await fetchQuadrants();
                    quadrantsRef.current = quadrantData;

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
                } catch (error) {
                    console.error("Error fetching quadrants:", error);
                }
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

                try {
                    const imageryProvider =
                        await IonImageryProvider.fromAssetId(3);
                    viewer.imageryLayers.addImageryProvider(imageryProvider);
                } catch (error) {
                    console.error("Error adding imagery provider:", error);
                }

                enableUndergroundView(viewer);
                moveCameraToDangermond(viewer);
                makeGroundTranslucentAsYouGetCloser(viewer);
                decreaseLevelOfDetail(viewer);
                repositionToolbar();

                viewer.screenSpaceEventHandler.removeInputAction(
                    ScreenSpaceEventType.LEFT_DOUBLE_CLICK
                );

                const scene = viewer.scene;
                const camera = scene.camera;

                const periodicMoveHandler = () => handleCameraMove(camera);

                const onMoveStart = () => {
                    if (moveIntervalRef.current === null) {
                        moveIntervalRef.current = setInterval(
                            periodicMoveHandler,
                            300
                        );
                    }
                };

                const onMoveEnd = async () => {
                    if (moveIntervalRef.current !== null) {
                        clearInterval(moveIntervalRef.current);
                        moveIntervalRef.current = null;
                        await handleCameraMove(camera);
                    }

                    const cameraCartographic = Cartographic.fromCartesian(
                        camera.position
                    );
                    const cameraHeight = cameraCartographic.height;
                    const newShowWells = cameraHeight <= thresholdHeight;

                    if (showWellsRef.current !== newShowWells) {
                        setShowWells(newShowWells);
                        showWellsRef.current = newShowWells;

                        if (!newShowWells) {
                            setTooltipString("");
                        }
                    }
                };

                scene.camera.moveStart.addEventListener(onMoveStart);
                scene.camera.moveEnd.addEventListener(onMoveEnd);

                await handleCameraMove(camera);

                setFinishedLoading(true);

                return () => {
                    scene.camera.moveStart.removeEventListener(onMoveStart);
                    scene.camera.moveEnd.removeEventListener(onMoveEnd);
                    if (moveIntervalRef.current !== null) {
                        clearInterval(moveIntervalRef.current);
                        moveIntervalRef.current = null;
                    }
                };
            }
        }, 100);

        window.addEventListener("resize", repositionToolbar);

        return () => {
            clearInterval(checkViewerReady);
            window.removeEventListener("resize", repositionToolbar);
        };
    }, [handleCameraMove, thresholdHeight]);

    const chunkOutlinePositions = useMemo(() => {
        if (!currentQuadrant) return null;
        const { topLeft, bottomRight } = currentQuadrant;

        const topRight = { lat: topLeft.lat, lon: bottomRight.lon };
        const bottomLeft = { lat: bottomRight.lat, lon: topLeft.lon };

        const positions = [
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
            Cartesian3.fromDegrees(topRight.lon, topRight.lat),
            Cartesian3.fromDegrees(bottomRight.lon, bottomRight.lat),
            Cartesian3.fromDegrees(bottomLeft.lon, bottomLeft.lat),
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
        ];
        return positions;
    }, [currentQuadrant]);

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
                    navigationHelpButton={false}
                    homeButton={false}
                    baseLayerPicker={true}
                    geocoder={false}
                    selectionIndicator={false}
                    infoBox={false}
                >
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

                    {chunkOutlinePositions && showWells && (
                        <GroundPolylinePrimitiveComponent
                            positions={chunkOutlinePositions}
                            width={2.0}
                            color={CesiumColor.WHITE}
                        />
                    )}

                    {finishedLoading &&
                        viewerRef.current?.cesiumElement &&
                        showAggregations && (
                            <>
                                <StateAggregations
                                    viewer={viewerRef.current.cesiumElement}
                                />
                                <CountyAggregations
                                    viewer={viewerRef.current.cesiumElement}
                                />
                            </>
                        )}
                </Viewer>
                <Tooltip />
            </div>
        </div>
    );
};

export default ResiumViewerComponent;
