import {
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    CesiumTerrainProvider,
    Color,
    NearFarScalar,
    sampleTerrainMostDetailed,
    VerticalOrigin,
} from "cesium";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    BillboardGraphics,
    EllipseGraphics,
    Entity,
    EntityDescription,
} from "resium";
import MapIconWaterPresent from "../../assets/MapIconWaterPresent.png";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as necessary
import { WellData } from "../../context/WellData";
import { wellDataFromRawData } from "../../context/WellDataFileReader";

interface CylinderEntitiesProps {
    terrainProvider: CesiumTerrainProvider | undefined | null;
    wellDataWithoutElevationAdjustments: WellData[];
}

const PreMemoizedCylinderEntities: React.FC<CylinderEntitiesProps> = ({
    terrainProvider,
    wellDataWithoutElevationAdjustments,
}) => {
    const heightWellShouldShowAboveSurface = 1;
    const heightMapIconShouldShowAboveWell = 20;
    const [wellDataWithHeights, setWellDataWithHeights] =
        useState(wellDataFromRawData);
    const { setTooltipString, setTooltipX, setTooltipY } =
        useContext(TooltipContext);

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
        } else {
            sampleTerrainHeights(wellDataFromRawData);
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

                return (
                    <React.Fragment key={wellIndex}>
                        <Entity
                            key={`billboard_${wellIndex}`}
                            position={indicatorStartPosition}
                            onMouseMove={() => handleIconMouseOver(wellIndex)}
                            onMouseLeave={handleMouseOut}
                        >
                            <BillboardGraphics
                                image={MapIconWaterPresent} // Replace with the correct path to MapIcon.png
                                verticalOrigin={VerticalOrigin.BOTTOM}
                                scaleByDistance={
                                    new NearFarScalar(1.5e2, 0.7, 1.5e5, 0.2) // Adjust scale based on distance
                                }
                            />
                            <EntityDescription>
                                <h2>{`Map Icon for Well ${well.StateWellID}`}</h2>
                            </EntityDescription>
                        </Entity>
                        {well.layers.map((layer, layerIndex) => {
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
                                    onMouseMove={() =>
                                        handleMouseOver(wellIndex, layerIndex)
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
                                        rotation={CesiumMath.toRadians(-40.0)}
                                        material={Color.fromCssColorString(
                                            layer.color
                                        )}
                                    />
                                    <EntityDescription>
                                        <h1>{`Layer ${layerIndex} of Cylinder ${wellIndex}`}</h1>
                                        {well.metadata ? (
                                            <p>{well.metadata}</p>
                                        ) : null}
                                    </EntityDescription>
                                </Entity>
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </>
    );
};

const CylinderEntities = React.memo(PreMemoizedCylinderEntities);

export default CylinderEntities;
