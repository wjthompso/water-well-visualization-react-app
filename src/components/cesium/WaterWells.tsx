// src/components/cesium/WaterWells.tsx

import {
    CallbackProperty,
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    CesiumTerrainProvider,
    Color,
    NearFarScalar,
    VerticalOrigin,
} from "cesium";
import React, {
    MutableRefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    BillboardGraphics,
    CustomDataSource,
    EllipseGraphics,
    Entity,
} from "resium";
import { TooltipContext } from "../../context/AppContext";
import { createPieChartWellIcon } from "../../utilities/createPieChartWellIcon";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import { Layer, SubChunk, SubChunkedWellData, WellData } from "./types";

type WellDataInput = WellData[] | SubChunkedWellData;

interface WaterWellsProps {
    terrainProvider: CesiumTerrainProvider | undefined | null;
    wellDataWithoutElevationAdjustments: WellDataInput;
    viewerRef: MutableRefObject<CesiumViewerInstance | null>;
}

const WaterWells: React.FC<WaterWellsProps> = ({
    terrainProvider,
    wellDataWithoutElevationAdjustments,
    viewerRef,
}) => {
    const heightWellShouldShowAboveSurface = 1;
    const heightMapIconShouldShowAboveWell = 20;
    const [wellDataWithHeights, setWellDataWithHeights] = useState<WellData[]>(
        []
    );
    const { setTooltipString, setTooltipX, setTooltipY, setSelectedWellData } =
        useContext(TooltipContext);

    const maxRenderDistance = 1609.34 * 2; // 2 miles in meters

    // State to store camera position
    const [cameraPosition, setCameraPosition] = useState<Cartesian3 | null>(
        null
    );

    // State for sub-chunked data using serialized keys
    const [processedWellDataMap, setProcessedWellDataMap] = useState<
        Map<string, WellData[]>
    >(new Map());

    const [currentSubChunkKey, setCurrentSubChunkKey] = useState<string | null>(
        null
    );

    // Ref to store interval ID
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // State to track if the camera is moving
    const [isCameraMoving, setIsCameraMoving] = useState<boolean>(false);

    // Ref to track click timeout for detecting double clicks
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State to track the currently zoomed-in well
    const [currentlyZoomedWell, setCurrentlyZoomedWell] =
        useState<WellData | null>(null);

    // Helper function to check if data is sub-chunked
    const isSubChunkedData = (
        data: WellDataInput
    ): data is SubChunkedWellData => {
        return (data as SubChunkedWellData).sub_chunks !== undefined;
    };

    // Helper function to serialize sub-chunk locations into unique keys
    const serializeSubChunkKey = useCallback((subChunk: SubChunk): string => {
        const { topLeft, bottomRight } = subChunk.location;
        return `${topLeft.lat.toFixed(6)},${topLeft.lon.toFixed(
            6
        )}-${bottomRight.lat.toFixed(6)},${bottomRight.lon.toFixed(6)}`;
    }, []);

    // Handle camera movement by updating camera position and currentSubChunkKey
    const handleCameraMove = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const globe = viewer.scene.globe;
        const camera = viewer.camera;

        const cartographicPosition = Cartographic.fromCartesian(
            camera.position
        );
        const currentLat = Number(
            CesiumMath.toDegrees(cartographicPosition.latitude).toFixed(6)
        );
        const currentLon = Number(
            CesiumMath.toDegrees(cartographicPosition.longitude).toFixed(6)
        );

        if (isSubChunkedData(wellDataWithoutElevationAdjustments)) {
            const hoveredSubChunk =
                wellDataWithoutElevationAdjustments.sub_chunks.find(
                    (subChunk) => {
                        const { topLeft, bottomRight } = subChunk.location;
                        return (
                            currentLat >= topLeft.lat &&
                            currentLat <= bottomRight.lat &&
                            currentLon >= topLeft.lon &&
                            currentLon <= bottomRight.lon
                        );
                    }
                );

            if (hoveredSubChunk) {
                const serializedKey = serializeSubChunkKey(hoveredSubChunk);
                if (
                    serializedKey !== currentSubChunkKey &&
                    processedWellDataMap.has(serializedKey)
                ) {
                    setCurrentSubChunkKey(serializedKey);
                    console.log(
                        "Setting currentSubChunkKey to:",
                        serializedKey
                    );
                } else if (!processedWellDataMap.has(serializedKey)) {
                    console.log(
                        "Data not yet available for sub-chunk key:",
                        serializedKey
                    );
                }
            } else {
                if (currentSubChunkKey !== null) {
                    setCurrentSubChunkKey(null);
                    console.log("Clearing currentSubChunkKey.");
                }
            }
        } else {
            if (currentSubChunkKey !== null) {
                setCurrentSubChunkKey(null);
                console.log("Clearing currentSubChunkKey for flat data.");
            }
        }

        // Update camera position state
        setCameraPosition(camera.position.clone());
    }, [
        viewerRef,
        wellDataWithoutElevationAdjustments,
        currentSubChunkKey,
        serializeSubChunkKey,
        processedWellDataMap,
    ]);

    // Set up camera event listeners using moveStart and moveEnd
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const onMoveStart = () => {
            if (intervalRef.current === null) {
                // Start interval to call handleCameraMove every 300ms
                intervalRef.current = setInterval(handleCameraMove, 100);
                setIsCameraMoving(true);
            }
        };

        const onMoveEnd = () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                handleCameraMove(); // Final call after movement ends
                setIsCameraMoving(false);
            }
        };

        viewer.camera.moveStart.addEventListener(onMoveStart);
        viewer.camera.moveEnd.addEventListener(onMoveEnd);

        return () => {
            viewer.camera.moveStart.removeEventListener(onMoveStart);
            viewer.camera.moveEnd.removeEventListener(onMoveEnd);
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [handleCameraMove, viewerRef]);

    // Process terrain heights using globe.getHeight
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) {
            console.log("Viewer is not available");
            return;
        }

        const globe = viewer.scene.globe;

        if (!globe) {
            console.log("Globe is not available");
            return;
        }

        const processTerrainHeightsForSubChunk = (
            subChunk: SubChunk
        ): WellData[] => {
            const data = subChunk.wells;
            if (data.length === 0) return [];

            const newWellData: WellData[] = data.map((well) => {
                const cartographic = Cartographic.fromDegrees(
                    well.longitude,
                    well.latitude
                );

                const terrainHeight = globe.getHeight(cartographic);

                if (terrainHeight === undefined) {
                    console.warn(
                        `Terrain height not available for well ID: ${well.StateWellID}`
                    );
                    // You can choose to set a default height or skip this well
                    return { ...well };
                }

                const adjustedStartDepth = terrainHeight - well.startDepth;
                const adjustedEndDepth = terrainHeight - well.endDepth;

                const adjustedLayers = well.layers.map((layer) => ({
                    ...layer,
                    startDepth: terrainHeight - layer.startDepth,
                    endDepth: terrainHeight - layer.endDepth,
                    unAdjustedStartDepth: layer.startDepth,
                    unAdjustedEndDepth: layer.endDepth,
                }));

                return {
                    ...well,
                    layers: adjustedLayers,
                    startDepth: adjustedStartDepth,
                    endDepth: adjustedEndDepth,
                };
            });

            return newWellData;
        };

        const processTerrainHeights = () => {
            if (isSubChunkedData(wellDataWithoutElevationAdjustments)) {
                const subChunks =
                    wellDataWithoutElevationAdjustments.sub_chunks;
                const newProcessedData = new Map<string, WellData[]>();

                subChunks.forEach((subChunk) => {
                    const serializedKey = serializeSubChunkKey(subChunk);
                    const newWellData =
                        processTerrainHeightsForSubChunk(subChunk);
                    newProcessedData.set(serializedKey, newWellData);
                    console.log(
                        `Processed sub-chunk with key: ${serializedKey}`
                    );
                });

                setProcessedWellDataMap(newProcessedData);
                console.log("ProcessedWellDataMap updated.");

                // After processing, update currentSubChunkKey if necessary
                handleCameraMove();
            } else {
                // Flat data
                const data = wellDataWithoutElevationAdjustments as WellData[];
                if (data.length === 0) {
                    console.log("No wells to process");
                    return;
                }

                const newWellData = data.map((well) => {
                    const cartographic = Cartographic.fromDegrees(
                        well.longitude,
                        well.latitude
                    );

                    const terrainHeight = globe.getHeight(cartographic);

                    if (terrainHeight === undefined) {
                        console.warn(
                            `Terrain height not available for well ID: ${well.StateWellID}`
                        );
                        // You can choose to set a default height or skip this well
                        return { ...well };
                    }

                    const adjustedStartDepth = terrainHeight - well.startDepth;
                    const adjustedEndDepth = terrainHeight - well.endDepth;

                    const adjustedLayers = well.layers.map((layer: Layer) => ({
                        ...layer,
                        startDepth: terrainHeight - layer.startDepth,
                        endDepth: terrainHeight - layer.endDepth,
                        unAdjustedStartDepth: layer.startDepth,
                        unAdjustedEndDepth: layer.endDepth,
                    }));

                    return {
                        ...well,
                        layers: adjustedLayers,
                        startDepth: adjustedStartDepth,
                        endDepth: adjustedEndDepth,
                    };
                });

                setWellDataWithHeights(newWellData);
            }
        };

        processTerrainHeights();
    }, [
        viewerRef,
        wellDataWithoutElevationAdjustments,
        serializeSubChunkKey,
        handleCameraMove, // Added dependency
    ]);

    // Trigger handleCameraMove when processedWellDataMap changes
    useEffect(() => {
        if (!isCameraMoving) {
            handleCameraMove();
        }
    }, [processedWellDataMap, handleCameraMove, isCameraMoving]);

    // Data to render
    const dataToRender: WellData[] = useMemo(() => {
        if (isSubChunkedData(wellDataWithoutElevationAdjustments)) {
            if (
                currentSubChunkKey &&
                processedWellDataMap.has(currentSubChunkKey)
            ) {
                console.log(
                    "Rendering data for sub-chunk key:",
                    currentSubChunkKey
                );
                return processedWellDataMap.get(currentSubChunkKey) || [];
            } else {
                console.log(
                    "No data available for current sub-chunk key:",
                    currentSubChunkKey
                );
                return [];
            }
        } else {
            return wellDataWithHeights;
        }
    }, [
        wellDataWithoutElevationAdjustments,
        currentSubChunkKey,
        processedWellDataMap,
        wellDataWithHeights,
    ]);

    // Memoize the cylinders to render based on camera position
    const cylindersToRender = useMemo(() => {
        if (!cameraPosition || dataToRender.length === 0) return [];

        return dataToRender.filter((well) => {
            if (
                well.layers.length === 0 ||
                well.layers[0].startDepth === undefined
            ) {
                return false;
            }

            const indicatorStartPosition = Cartesian3.fromDegrees(
                well.longitude,
                well.latitude,
                well.layers[0].startDepth +
                    heightWellShouldShowAboveSurface +
                    heightMapIconShouldShowAboveWell
            );

            const distanceFromCamera = Cartesian3.distance(
                cameraPosition,
                indicatorStartPosition
            );

            return distanceFromCamera < maxRenderDistance;
        });
    }, [cameraPosition, dataToRender, maxRenderDistance]);

    // Handle mouse movement for tooltips
    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            setTooltipX(event.clientX);
            setTooltipY(event.clientY);
        },
        [setTooltipX, setTooltipY]
    );

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [handleMouseMove]);

    // Handle mouse over on well layers
    const handleMouseOver = useCallback(
        (well: WellData, layerIndex: number) => {
            const layer = well.layers[layerIndex];
            const types = layer.type;
            const stringDescription = layer.description;
            const startDepth =
                Math.round(layer.unAdjustedStartDepth * 100) / 100;
            const endDepth = Math.round(layer.unAdjustedEndDepth * 100) / 100;
            setTooltipString({
                startDepth,
                endDepth,
                lithologyDescription: stringDescription,
                type: types,
            });
        },
        [setTooltipString]
    );

    // Handle mouse out from well layers
    const handleMouseOut = useCallback(() => {
        setTooltipString("");
    }, [setTooltipString]);

    // Handle mouse over on well icon
    const handleIconMouseOver = useCallback(
        (well: WellData) => {
            const StateWellID = well.StateWellID;
            setTooltipString(`${StateWellID}`);
        },
        [setTooltipString]
    );

    // Function to fly to or fly out from a well
    const flyToWell = useCallback(
        (well: WellData) => {
            const viewer = viewerRef.current;
            if (!viewer) return;

            // Determine if we're already zoomed into this well
            const isAlreadyZoomedIn =
                currentlyZoomedWell &&
                currentlyZoomedWell.StateWellID === well.StateWellID;

            let destination: Cartesian3;

            if (isAlreadyZoomedIn) {
                // Fly out to a higher altitude, keeping the well centered
                const flyOutHeight = 10000; // Adjust as needed for higher altitude
                destination = Cartesian3.fromDegrees(
                    well.longitude,
                    well.latitude - 0.05,
                    flyOutHeight
                );
            } else {
                // Fly into the well
                let cameraHeight;
                if (
                    well.layers.length > 0 &&
                    well.layers[0].startDepth !== undefined
                ) {
                    const startDepth = well.layers[0].startDepth;
                    cameraHeight = startDepth + 500; // 500 meters above the well
                } else {
                    cameraHeight = 500; // Default altitude if data is missing
                }

                destination = Cartesian3.fromDegrees(
                    well.longitude,
                    well.latitude - 0.0025, // Adjust latitude slightly if needed
                    cameraHeight
                );
            }

            // Set isCameraMoving to true
            setIsCameraMoving(true);

            // Fly the camera to the destination
            viewer.camera.flyTo({
                destination: destination,
                orientation: {
                    heading: CesiumMath.toRadians(0), // Facing north
                    pitch: CesiumMath.toRadians(-60), // 60 degrees downward
                    roll: 0.0, // No roll
                },
                duration: 1, // Flight duration in seconds
                complete: () => {
                    if (isAlreadyZoomedIn) {
                        // After flying out, clear the currentlyZoomedWell
                        setCurrentlyZoomedWell(null);
                    } else {
                        // After flying in, set the currentlyZoomedWell
                        setCurrentlyZoomedWell(well);
                    }
                    // Set isCameraMoving to false
                    setIsCameraMoving(false);
                },
                cancel: () => {
                    // Set isCameraMoving to false
                    setIsCameraMoving(false);
                },
            });
        },
        [viewerRef, currentlyZoomedWell]
    );

    // Handle click (single and double click)
    const handleClick = useCallback(
        (well: WellData) => {
            // Prevent handling clicks while the camera is moving
            if (isCameraMoving) {
                return;
            }

            // Double-click detection
            if (clickTimeoutRef.current !== null) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;

                // Handle double-click: Fly to or fly out from the well
                flyToWell(well);
            } else {
                setSelectedWellData(well);
                // Handle single-click: Select the well data
                clickTimeoutRef.current = setTimeout(() => {
                    // Clear the timeout
                    clickTimeoutRef.current = null;
                }, 250); // Timeout duration in milliseconds
            }
        },
        [isCameraMoving, flyToWell, setSelectedWellData]
    );

    // Clean up the click timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current !== null) {
                clearTimeout(clickTimeoutRef.current);
            }
        };
    }, []);

    // Generate sub-chunk grid lines
    const subChunkGridLines = useMemo(() => {
        if (isSubChunkedData(wellDataWithoutElevationAdjustments)) {
            const lines: { positions: Cartesian3[]; color: Color }[] = [];

            wellDataWithoutElevationAdjustments.sub_chunks.forEach(
                (subChunk) => {
                    const { topLeft, bottomRight } = subChunk.location;

                    const topRight = {
                        lat: topLeft.lat,
                        lon: bottomRight.lon,
                    };
                    const bottomLeft = {
                        lat: bottomRight.lat,
                        lon: topLeft.lon,
                    };

                    const positions = [
                        Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
                        Cartesian3.fromDegrees(topRight.lon, topRight.lat),
                        Cartesian3.fromDegrees(
                            bottomRight.lon,
                            bottomRight.lat
                        ),
                        Cartesian3.fromDegrees(bottomLeft.lon, bottomLeft.lat),
                        Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
                    ];

                    const serializedKey = serializeSubChunkKey(subChunk);
                    const isCurrent = serializedKey === currentSubChunkKey;

                    lines.push({
                        positions,
                        color: isCurrent ? Color.YELLOW : Color.WHITE,
                    });
                }
            );

            return lines;
        } else {
            return [];
        }
    }, [
        wellDataWithoutElevationAdjustments,
        currentSubChunkKey,
        serializeSubChunkKey,
    ]);

    // Loading state indicator
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Render conditionally based on loading state
    if (isLoading) {
        return <div>Loading wells...</div>; // You can replace this with a spinner or other indicator
    }

    if (dataToRender.length === 0) {
        return null; // Or render a message indicating no data
    }

    return (
        <CustomDataSource name="WaterWellsDataSource">
            {dataToRender.map((well, wellIndex) => {
                if (
                    well.layers.length === 0 ||
                    well.layers[0].startDepth === undefined
                ) {
                    return null;
                }

                const indicatorStartPosition = Cartesian3.fromDegrees(
                    well.longitude,
                    well.latitude,
                    well.layers[0].startDepth +
                        heightWellShouldShowAboveSurface +
                        heightMapIconShouldShowAboveWell
                );

                const eyeOffsetCallback = new CallbackProperty(() => {
                    const viewer = viewerRef.current;
                    if (!viewer) return new Cartesian3(0, 0, -5000);
                    const cameraPos = viewer.camera.position;
                    const distance = Cartesian3.distance(
                        cameraPos,
                        indicatorStartPosition
                    );

                    return new Cartesian3(0, 0, -Math.min(distance - 20, 5000));
                }, false);

                // Check if cylinders for this well should be rendered
                const shouldRenderThisCylinder: boolean =
                    cylindersToRender.includes(well);

                return (
                    <React.Fragment key={wellIndex}>
                        {/* Always render the billboard */}
                        <Entity
                            key={`billboard_${wellIndex}`}
                            position={indicatorStartPosition}
                            onClick={() => handleClick(well)}
                            onMouseMove={() => handleIconMouseOver(well)}
                            onMouseLeave={handleMouseOut}
                        >
                            <BillboardGraphics
                                image={createPieChartWellIcon(well)}
                                verticalOrigin={VerticalOrigin.BOTTOM}
                                scaleByDistance={
                                    new NearFarScalar(
                                        1.5e2,
                                        0.15 * 4,
                                        1.5e5,
                                        0.05 * 4
                                    )
                                }
                                eyeOffset={eyeOffsetCallback}
                            />
                        </Entity>

                        {/* Conditionally render cylinders based on distance */}
                        {shouldRenderThisCylinder &&
                            well.layers.map((layer, layerIndex) => {
                                const layerStartPositionCartesian =
                                    Cartesian3.fromDegrees(
                                        well.longitude,
                                        well.latitude,
                                        layer.startDepth
                                    );

                                return (
                                    <Entity
                                        key={`cylinder_${wellIndex}_${layerIndex}`}
                                        position={layerStartPositionCartesian}
                                        onClick={() => handleClick(well)}
                                        onMouseMove={() =>
                                            handleMouseOver(well, layerIndex)
                                        }
                                        onMouseLeave={handleMouseOut}
                                    >
                                        <EllipseGraphics
                                            semiMinorAxis={5.0}
                                            semiMajorAxis={5.0}
                                            height={
                                                heightWellShouldShowAboveSurface +
                                                layer.startDepth
                                            }
                                            extrudedHeight={
                                                heightWellShouldShowAboveSurface +
                                                layer.endDepth
                                            }
                                            rotation={CesiumMath.toRadians(
                                                -40.0
                                            )}
                                            material={Color.fromCssColorString(
                                                layer.color
                                            )}
                                        />
                                    </Entity>
                                );
                            })}
                    </React.Fragment>
                );
            })}

            {/* Render sub-chunk grid */}
            {isSubChunkedData(wellDataWithoutElevationAdjustments) &&
                subChunkGridLines.map((line, index) => (
                    <GroundPolylinePrimitiveComponent
                        key={`subChunkLine_${index}`}
                        positions={line.positions}
                        width={2.0}
                        color={line.color}
                    />
                ))}
        </CustomDataSource>
    );
};

export default WaterWells;
