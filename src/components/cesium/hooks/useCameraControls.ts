// src/components/cesium/hooks/useCameraControls.ts

import {
    Camera,
    Cartographic,
    Math as CesiumMath,
    Viewer as CesiumViewerInstance,
    ScreenSpaceEventType,
} from "cesium";
import { useCallback, useEffect, useRef } from "react";

import { fetchWellData } from "../../../utilities/api";
import {
    decreaseLevelOfDetail,
    enableUndergroundView,
    makeGroundTranslucentAsYouGetCloser,
    moveCameraToDangermond,
} from "../../../utilities/cameraUtils";
import {
    calculateChunkKey,
    createLocationKey,
} from "../../../utilities/chunkUtils";
import {
    fillInMissingLayers,
    isSubChunkedData,
    processRawWellData,
} from "../../../utilities/wellDataUtils";
import { Chunk, SubChunkedWellData, WellData } from "../types";

/**
 * useCameraControls Hook
 *
 * Manages camera movements, event listeners, and related side effects for the Cesium viewer.
 *
 * @param params - An object containing necessary references and state setters.
 */
interface UseCameraControlsParams {
    viewerRef: React.MutableRefObject<CesiumViewerInstance | null>;
    quadrantsMapRef: React.MutableRefObject<Map<string, Chunk>>;
    minLat: number;
    minLon: number;
    latStep: number;
    lonStep: number;
    chunkSplitN: number;
    terrainFlatteningThreshold: number;
    thresholdHeight: number;
    setCurrentQuadrant: React.Dispatch<
        React.SetStateAction<Chunk | null | undefined>
    >;
    setWellData: React.Dispatch<
        React.SetStateAction<WellData[] | SubChunkedWellData>
    >;
    setShowWells: React.Dispatch<React.SetStateAction<boolean>>;
    setShowAggregations: React.Dispatch<React.SetStateAction<boolean>>;
    setFinishedLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setInitialLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setTerrainHeightsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    setTooltipString?: React.Dispatch<React.SetStateAction<string>>;
    viewerReady: boolean; // Add viewerReady as a parameter
}

const useCameraControls = ({
    viewerRef,
    quadrantsMapRef,
    minLat,
    minLon,
    latStep,
    lonStep,
    chunkSplitN,
    terrainFlatteningThreshold,
    thresholdHeight,
    setCurrentQuadrant,
    setWellData,
    setShowWells,
    setShowAggregations,
    setFinishedLoading,
    setInitialLoading,
    setTerrainHeightsLoaded,
    setTooltipString,
    viewerReady,
}: UseCameraControlsParams) => {
    const currentQuadrantRef = useRef<Chunk | null | undefined>(null);
    const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const showWellsRef = useRef<boolean>(true);
    const initialLoadingRef = useRef<boolean>(true); // useRef to avoid state in event handler

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
            setWellData([]);

            // Fetch and set new well data if it exists in the map
            if (quadrantsMapRef.current.has(chunkKey)) {
                const fetchedChunk = quadrantsMapRef.current.get(chunkKey);
                if (fetchedChunk) {
                    const locationKey = createLocationKey(fetchedChunk);
                    try {
                        const rawWellData = await fetchWellData(locationKey);

                        if (isSubChunkedData(rawWellData)) {
                            // Process each sub-chunk's wells
                            const processedSubChunks =
                                rawWellData.sub_chunks.map((subChunk) => ({
                                    ...subChunk,
                                    wells: fillInMissingLayers(
                                        processRawWellData(subChunk.wells)
                                    ),
                                }));
                            setWellData({ sub_chunks: processedSubChunks });
                        } else {
                            // Handle flat data
                            const processedWellData =
                                processRawWellData(rawWellData);
                            const filledWellData =
                                fillInMissingLayers(processedWellData);
                            setWellData(filledWellData);
                        }

                        setCurrentQuadrant(fetchedChunk);
                        currentQuadrantRef.current = fetchedChunk;
                    } catch (error) {
                        console.error("Error fetching well data:", error);
                    }
                }
            } else {
                // If the chunk does not exist in the map, update the quadrant but keep wells empty
                setCurrentQuadrant(calculatedCurrentChunk);
                currentQuadrantRef.current = calculatedCurrentChunk;
            }

            // Adjust terrain exaggeration based on the camera height
            // NOTE: I think this is dead code
            const cameraHeight = cartographicPosition.height;
            const viewerCesium = viewerRef.current;
            if (viewerCesium) {
                if (cameraHeight > terrainFlatteningThreshold) {
                    if (viewerCesium.scene.verticalExaggeration !== 0.0) {
                        viewerCesium.scene.verticalExaggeration = 0.0; // Flatten terrain
                    }
                } else {
                    if (viewerCesium.scene.verticalExaggeration !== 1.0) {
                        viewerCesium.scene.verticalExaggeration = 1.0; // Restore terrain
                    }
                }
            }
        },
        [
            minLat,
            minLon,
            latStep,
            lonStep,
            chunkSplitN,
            terrainFlatteningThreshold,
            quadrantsMapRef,
            setCurrentQuadrant,
            setWellData,
        ]
    );

    useEffect(() => {
        if (!viewerReady) {
            return;
        }

        const viewerCesium = viewerRef.current;
        if (!viewerCesium) {
            return;
        }

        const setupCameraControls = () => {
            const scene = viewerCesium.scene;
            const camera = scene.camera;

            // Initial camera setup
            moveCameraToDangermond(viewerCesium);
            enableUndergroundView(viewerCesium);
            makeGroundTranslucentAsYouGetCloser(viewerCesium);
            decreaseLevelOfDetail(viewerCesium);

            // Aggregation visibility based on camera height
            const handleAggregationVisibility = () => {
                const cameraCartographic = Cartographic.fromCartesian(
                    camera.position
                );
                const cameraHeight = cameraCartographic.height;
                const newShowAggregations = cameraHeight >= thresholdHeight;
                setShowAggregations(newShowAggregations);
            };

            let moveIntervalId: number | null = null;
            const onMoveStartAggregation = () => {
                if (moveIntervalId === null) {
                    moveIntervalId = window.setInterval(
                        handleAggregationVisibility,
                        300
                    );
                }
            };

            const onMoveEndAggregation = () => {
                if (moveIntervalId !== null) {
                    window.clearInterval(moveIntervalId);
                    moveIntervalId = null;
                    handleAggregationVisibility();
                }
            };

            camera.moveStart.addEventListener(onMoveStartAggregation);
            camera.moveEnd.addEventListener(onMoveEndAggregation);

            // Remove double-click action
            viewerCesium.screenSpaceEventHandler.removeInputAction(
                ScreenSpaceEventType.LEFT_DOUBLE_CLICK
            );

            // Tile Load Progress Handler
            const handleTileLoadProgress = (queuedTileCount: number) => {
                if (initialLoadingRef.current) {
                    if (queuedTileCount === 0) {
                        initialLoadingRef.current = false;
                        setInitialLoading(false);
                        setTerrainHeightsLoaded(true);
                        viewerCesium.scene.globe.tileLoadProgressEvent.removeEventListener(
                            handleTileLoadProgress
                        );
                        setFinishedLoading(true);
                    }
                }
            };

            viewerCesium.scene.globe.tileLoadProgressEvent.addEventListener(
                handleTileLoadProgress
            );

            // Periodic Move Handler
            const periodicMoveHandler = () => {
                const cameraCartographic = Cartographic.fromCartesian(
                    camera.position
                );
                const cameraHeight = cameraCartographic.height;
                const newShowWells = cameraHeight <= thresholdHeight;

                if (showWellsRef.current !== newShowWells) {
                    setShowWells(newShowWells);
                    showWellsRef.current = newShowWells;

                    if (!newShowWells && setTooltipString) {
                        setTooltipString("");
                    }
                }
                handleCameraMove(camera);
            };

            const onMoveStart = () => {
                if (moveIntervalRef.current === null) {
                    moveIntervalRef.current = setInterval(
                        periodicMoveHandler,
                        200
                    );
                    // console.log("Periodic camera move handler started.");
                }
            };

            const onMoveEnd = async () => {
                if (moveIntervalRef.current !== null) {
                    clearInterval(moveIntervalRef.current);
                    moveIntervalRef.current = null;
                    await handleCameraMove(camera);
                    // console.log("Periodic camera move handler stopped.");
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

                    if (!newShowWells && setTooltipString) {
                        setTooltipString("");
                    }
                }
            };

            // Add event listeners
            scene.camera.moveStart.addEventListener(onMoveStart);
            scene.camera.moveEnd.addEventListener(onMoveEnd);

            // Initial camera move handling
            handleCameraMove(camera);

            // Cleanup function
            return () => {
                scene.camera.moveStart.removeEventListener(onMoveStart);
                scene.camera.moveEnd.removeEventListener(onMoveEnd);
                viewerCesium.scene.globe.tileLoadProgressEvent.removeEventListener(
                    handleTileLoadProgress
                );
                if (moveIntervalRef.current !== null) {
                    clearInterval(moveIntervalRef.current);
                    moveIntervalRef.current = null;
                    console.log("Periodic camera move handler cleaned up.");
                }
                camera.changed.removeEventListener(handleAggregationVisibility);
            };
        };

        setupCameraControls();
    }, [
        viewerReady,
        viewerRef,
        handleCameraMove,
        thresholdHeight,
        setShowAggregations,
        setShowWells,
        setTooltipString,
        setFinishedLoading,
        setInitialLoading,
        setTerrainHeightsLoaded,
    ]);
};

export default useCameraControls;
