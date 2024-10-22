// src/components/cesium/WaterWells.tsx

import {
    CallbackProperty,
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    Color,
    NearFarScalar,
    VerticalOrigin,
    Viewer,
} from "cesium";
import React, {
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
import {
    isSubChunkedData,
    processTerrainHeightsForSubChunk,
    serializeSubChunkKey,
} from "../../utilities/waterWellUtils"; // Adjust the path if necessary
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import { Layer, SubChunkedWellData, WellData } from "./types";

type WellDataInput = WellData[] | SubChunkedWellData;

interface WaterWellsProps {
    wellDataWithoutElevationAdjustments: WellDataInput;
    viewer: Viewer | null;
}

const WaterWells: React.FC<WaterWellsProps> = ({
    wellDataWithoutElevationAdjustments,
    viewer,
}) => {
    const heightWellShouldShowAboveSurface = 1;
    const heightMapIconShouldShowAboveWell = 20;
    const [wellDataWithHeights, setWellDataWithHeights] = useState<WellData[]>(
        []
    );
    const { selectedWellData, setSelectedWellData } =
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

    // Handle camera movement by updating camera position and currentSubChunkKey
    const handleCameraMove = useCallback(() => {
        if (!viewer) return;

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
                } else if (!processedWellDataMap.has(serializedKey)) {
                    // Handle cases where the sub-chunk data is not yet processed
                }
            } else {
                if (currentSubChunkKey !== null) {
                    setCurrentSubChunkKey(null);
                }
            }
        } else {
            if (currentSubChunkKey !== null) {
                setCurrentSubChunkKey(null);
            }
        }

        // Update camera position state
        setCameraPosition(camera.position.clone());
    }, [
        viewer,
        wellDataWithoutElevationAdjustments,
        currentSubChunkKey,
        serializeSubChunkKey,
        processedWellDataMap,
    ]);

    // Set up camera event listeners using moveStart and moveEnd
    useEffect(() => {
        if (!viewer) return;

        const onMoveStart = () => {
            if (intervalRef.current === null) {
                // Start interval to call handleCameraMove every 300ms
                intervalRef.current = setInterval(handleCameraMove, 300);
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
    }, [handleCameraMove, viewer]);

    // Process terrain heights using globe.getHeight
    useEffect(() => {
        if (!viewer) {
            return;
        }

        const globe = viewer.scene.globe;

        if (!globe) {
            return;
        }

        const processTerrainHeights = () => {
            if (isSubChunkedData(wellDataWithoutElevationAdjustments)) {
                const subChunks =
                    wellDataWithoutElevationAdjustments.sub_chunks;
                const newProcessedData = new Map<string, WellData[]>();

                subChunks.forEach((subChunk) => {
                    const serializedKey = serializeSubChunkKey(subChunk);
                    const newWellData = processTerrainHeightsForSubChunk(
                        subChunk,
                        globe
                    );
                    newProcessedData.set(serializedKey, newWellData);
                });

                setProcessedWellDataMap(newProcessedData);
            } else {
                // Flat data
                const data = wellDataWithoutElevationAdjustments as WellData[];
                if (data.length === 0) {
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
                        // Optionally, set a default height or skip this well
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
        viewer,
        wellDataWithoutElevationAdjustments,
        serializeSubChunkKey,
        processTerrainHeightsForSubChunk,
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
                return processedWellDataMap.get(currentSubChunkKey) || [];
            } else {
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

    // Function to fly to or fly out from a well
    const flyToWell = useCallback(
        (well: WellData) => {
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
        [viewer, currentlyZoomedWell]
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
                if (selectedWellData?.StateWellID !== well.StateWellID) {
                    setSelectedWellData(well);
                }
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
