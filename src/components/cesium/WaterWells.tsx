// WaterWell.tsx
import {
    CallbackProperty,
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    CesiumTerrainProvider,
    Color,
    NearFarScalar,
    sampleTerrainMostDetailed,
    VerticalOrigin,
    Viewer,
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
    CesiumComponentRef,
    EllipseGraphics,
    Entity,
} from "resium";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as necessary
import { WellData } from "../../context/WellData";
import { createPieChartWellIcon } from "../../utilities/createPieChartWellIcon";

interface CylinderEntitiesProps {
    terrainProvider: CesiumTerrainProvider | undefined | null;
    wellDataWithoutElevationAdjustments: WellData[];
    viewerRef: MutableRefObject<CesiumComponentRef<Viewer> | null>;
}

const PreMemoizedWaterWells: React.FC<CylinderEntitiesProps> = ({
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

    // Ref to store throttle timeout
    const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

    // State to track if the camera is moving
    const [isCameraMoving, setIsCameraMoving] = useState<boolean>(false);

    // Ref to track click timeout for detecting double clicks
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State to track the currently zoomed-in well
    const [currentlyZoomedWell, setCurrentlyZoomedWell] =
        useState<WellData | null>(null);

    // Set up camera changed listener
    useEffect(() => {
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer) return;

        const handleCameraChange = () => {
            if (throttleTimeout.current === null) {
                throttleTimeout.current = setTimeout(() => {
                    const cameraPos = viewer.camera.position.clone();
                    setCameraPosition(cameraPos);
                    throttleTimeout.current = null;
                }, 100); // Throttle updates to once every 100ms
            }
        };

        viewer.camera.changed.addEventListener(handleCameraChange);

        // Initialize camera position
        setCameraPosition(viewer.camera.position.clone());

        return () => {
            viewer.camera.changed.removeEventListener(handleCameraChange);
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
        };
    }, [viewerRef]);

    // Memoize the cylinders to render based on camera position
    const cylindersToRender = useMemo(() => {
        if (!cameraPosition || wellDataWithHeights.length === 0) return [];

        return wellDataWithHeights.filter((well) => {
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
    }, [cameraPosition, wellDataWithHeights, maxRenderDistance]);

    // Effect to sample terrain heights
    useEffect(() => {
        if (!terrainProvider) {
            console.log("Terrain provider is not ready yet");
            return;
        }

        const sampleTerrainHeights = async (data: WellData[]) => {
            const positions = data.map((well) =>
                Cartographic.fromDegrees(
                    well.longitude,
                    well.latitude,
                    well.startDepth
                )
            );

            try {
                const sampledPositions = await sampleTerrainMostDetailed(
                    terrainProvider,
                    positions
                );

                const newWellData = data.map((well, wellIndex) => {
                    const height = sampledPositions[wellIndex].height;
                    const layers = well.layers.map((layer) => ({
                        ...layer,
                        startDepth: height - layer.startDepth,
                        endDepth: height - layer.endDepth,
                        unAdjustedStartDepth: layer.startDepth,
                        unAdjustedEndDepth: layer.endDepth,
                    }));

                    return {
                        ...well,
                        layers,
                        startDepth: height - well.startDepth,
                        endDepth: height - well.endDepth,
                    };
                });

                setWellDataWithHeights(newWellData);
            } catch (error) {
                console.error("Error sampling terrain heights:", error);
            }
        };

        if (wellDataWithoutElevationAdjustments.length > 0) {
            sampleTerrainHeights(wellDataWithoutElevationAdjustments);
        }
    }, [terrainProvider, wellDataWithoutElevationAdjustments]);

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
            const viewer = viewerRef.current?.cesiumElement;
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
                        console.log(
                            `Camera has flown out from well: ${well.StateWellID}`
                        );
                    } else {
                        // After flying in, set the currentlyZoomedWell
                        setCurrentlyZoomedWell(well);
                        console.log(
                            `Camera has flown to well: ${well.StateWellID}`
                        );
                    }
                    // Set isCameraMoving to false
                    setIsCameraMoving(false);
                },
                cancel: () => {
                    console.log("Flight to/from well was canceled.");
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
                console.log("Camera is already moving, ignoring click");
                return;
            }

            // Double-click detection
            if (clickTimeoutRef.current !== null) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;

                // Handle double-click: Fly to or fly out from the well
                console.log("Double click detected, toggling camera view.");
                flyToWell(well);
            } else {
                // Handle single-click: Select the well data
                clickTimeoutRef.current = setTimeout(() => {
                    setSelectedWellData(well);
                    console.log("Single click detected, well data selected.");

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

    return (
        <>
            {wellDataWithHeights.map((well, wellIndex) => {
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
                    const viewer = viewerRef.current?.cesiumElement;
                    if (!viewer) return new Cartesian3(0, 0, -5000);
                    const cameraPos = viewer.camera.position;
                    const distance = Cartesian3.distance(
                        cameraPos,
                        indicatorStartPosition
                    );

                    return new Cartesian3(0, 0, -Math.min(distance - 20, 5000));
                }, false);

                // Check if cylinders for this well should be rendered
                const shouldRenderCylinders = cylindersToRender.includes(well);
                const viewer = viewerRef.current?.cesiumElement;
                const cameraPosition =
                    viewer?.camera.position ?? new Cartesian3();
                const distanceFromCamera = Cartesian3.distance(
                    cameraPosition,
                    indicatorStartPosition
                );

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
                                    new NearFarScalar(1.5e2, 0.15, 1.5e7, 0.075)
                                }
                                eyeOffset={eyeOffsetCallback}
                            />
                        </Entity>

                        {/* Conditionally render cylinders based on distance */}
                        {shouldRenderCylinders &&
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
        </>
    );
};

const WaterWell = React.memo(PreMemoizedWaterWells);

export default WaterWell;
