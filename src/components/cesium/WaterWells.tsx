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
    useState,
} from "react";
import {
    BillboardGraphics,
    CesiumComponentRef,
    EllipseGraphics,
    Entity,
} from "resium";
import MapIconNoWaterIcon from "../../assets/MapIconNoWaterIcon.svg";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as necessary
import { WellData } from "../../context/WellData";

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
    const [wellDataWithHeights, setWellDataWithHeights] = useState(
        [] as WellData[]
    );
    const { setTooltipString, setTooltipX, setTooltipY, setSelectedWellData } =
        useContext(TooltipContext);

    const maxRenderDistance = 1609.34 * 3; // 2 miles in meters

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

    const handleMouseOver = useCallback(
        (index: number, layer: number) => {
            const types = wellDataWithHeights[index].layers[layer].type;
            const stringDescription =
                wellDataWithHeights[index].layers[layer].description;
            const startDepth =
                Math.round(
                    wellDataWithHeights[index].layers[layer]
                        .unAdjustedStartDepth * 100
                ) / 100;
            const endDepth =
                Math.round(
                    wellDataWithHeights[index].layers[layer]
                        .unAdjustedEndDepth * 100
                ) / 100;
            setTooltipString({
                startDepth,
                endDepth,
                lithologyDescription: stringDescription,
                type: types,
            });
        },
        [setTooltipString, wellDataWithHeights]
    );

    const handleMouseOut = useCallback(() => {
        setTooltipString("");
    }, [setTooltipString]);

    const handleIconMouseOver = useCallback(
        (index: number) => {
            const StateWellID = wellDataWithHeights[index].StateWellID;
            setTooltipString(`${StateWellID}`);
        },
        [setTooltipString, wellDataWithHeights]
    );

    const handleClick = useCallback(
        (index: number) => {
            setSelectedWellData(wellDataWithHeights[index]);
        },
        [setSelectedWellData, wellDataWithHeights]
    );

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
                    const cameraPosition = viewer.camera.position;
                    const distance = Cartesian3.distance(
                        cameraPosition,
                        indicatorStartPosition
                    );

                    return new Cartesian3(0, 0, -Math.min(distance - 20, 5000));
                }, false);

                const viewer = viewerRef.current?.cesiumElement;
                const cameraPosition =
                    viewer?.camera.position ?? new Cartesian3();
                const distanceFromCamera = Cartesian3.distance(
                    cameraPosition,
                    indicatorStartPosition
                );

                return (
                    <React.Fragment key={wellIndex}>
                        <Entity
                            key={`billboard_${wellIndex}`}
                            position={indicatorStartPosition}
                            onClick={() => handleClick(wellIndex)}
                            onMouseMove={() => handleIconMouseOver(wellIndex)}
                            onMouseLeave={handleMouseOut}
                        >
                            <BillboardGraphics
                                image={MapIconNoWaterIcon}
                                verticalOrigin={VerticalOrigin.BOTTOM}
                                scaleByDistance={
                                    new NearFarScalar(1.5e2, 0.7, 1.5e5, 0.2)
                                }
                                eyeOffset={eyeOffsetCallback}
                            />
                        </Entity>
                        {distanceFromCamera < maxRenderDistance &&
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
                                        onClick={() => handleClick(wellIndex)}
                                        onMouseMove={() =>
                                            handleMouseOver(
                                                wellIndex,
                                                layerIndex
                                            )
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
