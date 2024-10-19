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
import DraggableComponent from "../DraggableFooter/DraggableFooter";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CustomSearchBar from "../Searchbar/CustomSearchbar";
import CountyAggregations from "./CountyAggregations";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import StateAggregations from "./StateAggregationComponent";
import Tooltip from "./Tooltip";
import WaterWells from "./WaterWells";
import { Chunk, SubChunkedWellData, WellData } from "./types";

// Import utility functions from the "utilities" directory
import { fetchQuadrants, fetchWellData } from "../../utilities/api";
import {
    decreaseLevelOfDetail,
    enableUndergroundView,
    makeGroundTranslucentAsYouGetCloser,
    moveCameraToDangermond,
} from "../../utilities/cameraUtils";
import {
    calculateChunkKey,
    createLocationKey,
} from "../../utilities/chunkUtils";
import {
    fillInMissingLayers,
    isSubChunkedData,
    processRawWellData,
} from "../../utilities/wellDataUtils";

const ResiumViewerComponent: React.FC = () => {
    const minLat = 24.536111;
    const maxLat = 49.36843957;
    const minLon = -124.592902859999;
    const maxLon = -67.4433;
    const chunkSplitN = 119;
    const terrainFlatteningThreshold = 1_500_000; // 1,500,000 meters

    const latStep = (maxLat - minLat) / chunkSplitN;
    const lonStep = (maxLon - minLon) / chunkSplitN;

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
    ] = useState<WellData[] | SubChunkedWellData>([]);
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

    // New State Variables
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [terrainHeightsLoaded, setTerrainHeightsLoaded] =
        useState<boolean>(false);

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
                return; // Early exit if the camera is still within the same quadrant
            }

            // Calculate the new chunk and quadrant information based on camera position
            const { chunkKey, chunk } = calculateChunkKey(
                currentLat,
                currentLon,
                minLat,
                minLon,
                latStep,
                lonStep,
                chunkSplitN
            );
            const calculatedCurrentChunk = chunk;

            // Clear old wells immediately to avoid visual lag
            setWellDataWithoutElevationAdjustments([]);

            // Fetch and set new well data if it exists in the map
            if (quadrantsMapRef.current.has(chunkKey)) {
                const chunk = quadrantsMapRef.current.get(chunkKey);
                if (chunk) {
                    const locationKey = createLocationKey(chunk);
                    console.log(
                        "Fetching well data for locationKey:",
                        locationKey
                    );
                    const rawWellData = await fetchWellData(locationKey);

                    if (isSubChunkedData(rawWellData)) {
                        // Process each sub-chunk's wells
                        const processedSubChunks = rawWellData.sub_chunks.map(
                            (subChunk) => ({
                                ...subChunk,
                                wells: fillInMissingLayers(
                                    processRawWellData(subChunk.wells)
                                ),
                            })
                        );
                        setWellDataWithoutElevationAdjustments({
                            sub_chunks: processedSubChunks,
                        });
                    } else {
                        // Handle flat data
                        const processedWellData =
                            processRawWellData(rawWellData);
                        const filledWellData =
                            fillInMissingLayers(processedWellData);
                        setWellDataWithoutElevationAdjustments(filledWellData);
                    }
                    setCurrentQuadrant(chunk);
                    currentQuadrantRef.current = chunk;
                }
            } else {
                // If the chunk does not exist in the map, update the quadrant but keep wells empty
                setCurrentQuadrant(calculatedCurrentChunk);
                currentQuadrantRef.current = calculatedCurrentChunk;
            }

            // Adjust terrain exaggeration based on the camera height
            const cameraHeight = cartographicPosition.height;
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement as CesiumViewer;
                if (cameraHeight > terrainFlatteningThreshold) {
                    if (viewer.scene.verticalExaggeration !== 0.0) {
                        viewer.scene.verticalExaggeration = 0.0; // Flatten terrain
                        console.log("Flattened the terrain.");
                    }
                } else {
                    if (viewer.scene.verticalExaggeration !== 1.0) {
                        viewer.scene.verticalExaggeration = 1.0; // Restore terrain
                        console.log("Restored terrain elevation.");
                    }
                }
            }
        },
        [
            terrainFlatteningThreshold,
            minLat,
            minLon,
            latStep,
            lonStep,
            chunkSplitN,
        ]
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
                            const topLeftLat = Number(
                                chunk.topLeft.lat.toFixed(6)
                            );
                            const topLeftLon = Number(
                                chunk.topLeft.lon.toFixed(6)
                            );
                            const bottomRightLat = Number(
                                chunk.bottomRight.lat.toFixed(6)
                            );
                            const bottomRightLon = Number(
                                chunk.bottomRight.lon.toFixed(6)
                            );
                            const chunkKey = `${topLeftLat},${topLeftLon}-${bottomRightLat},${bottomRightLon}`;
                            return [chunkKey, chunk];
                        })
                    );
                } catch (error) {
                    console.error("Error fetching quadrants:", error);
                }
                console.log("Quadrants fetched:", quadrantsRef.current);
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

                // Tile Load Progress Handler
                const handleTileLoadProgress = (queuedTileCount: number) => {
                    if (initialLoading) {
                        if (queuedTileCount === 0) {
                            setTerrainHeightsLoaded(true);
                            setInitialLoading(false);
                            console.log(
                                "Initial tiles and terrain heights have been loaded."
                            );
                            // Remove the event listener after initial loading
                            viewer.scene.globe.tileLoadProgressEvent.removeEventListener(
                                handleTileLoadProgress
                            );
                        }
                    }
                };

                // Add Event Listener
                viewer.scene.globe.tileLoadProgressEvent.addEventListener(
                    handleTileLoadProgress
                );

                const periodicMoveHandler = () => {
                    const cameraCartographic = Cartographic.fromCartesian(
                        camera.position
                    );
                    const cameraHeight = cameraCartographic.height;
                    const newShowWells = cameraHeight <= thresholdHeight;

                    if (showWellsRef.current !== newShowWells) {
                        setShowWells(newShowWells);
                        console.log("Set showWells to ", newShowWells);
                        showWellsRef.current = newShowWells;

                        if (!newShowWells) {
                            setTooltipString("");
                        }
                    }
                    handleCameraMove(camera);
                };

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
                        console.log("Set showWells to ", newShowWells);
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
                    if (initialLoading && viewerRef.current?.cesiumElement) {
                        viewer.scene.globe.tileLoadProgressEvent.removeEventListener(
                            handleTileLoadProgress
                        );
                    }
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
    }, [
        handleCameraMove,
        thresholdHeight,
        initialLoading,
        minLat,
        minLon,
        latStep,
        lonStep,
        chunkSplitN,
    ]);

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
            {initialLoading && (
                <div className="flex items-center justify-center w-full h-full md:pr-[272px] bg-headerBackgroundColor z-[100]">
                    <LoadingSpinner />
                </div>
            )}
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
                        terrainHeightsLoaded &&
                        wellDataWithoutElevationAdjustments &&
                        ((Array.isArray(wellDataWithoutElevationAdjustments) &&
                            wellDataWithoutElevationAdjustments.length > 0) ||
                            (!Array.isArray(
                                wellDataWithoutElevationAdjustments
                            ) &&
                                wellDataWithoutElevationAdjustments.sub_chunks
                                    .length > 0)) && (
                            <WaterWells
                                key={
                                    currentQuadrant
                                        ? createLocationKey(currentQuadrant)
                                        : "no-quadrant"
                                }
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
