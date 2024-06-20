import {
    Cartesian3,
    Cartographic,
    CesiumTerrainProvider,
    Color,
    Math,
    sampleTerrainMostDetailed,
} from "cesium";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { EllipseGraphics, Entity, EntityDescription } from "resium";
// import { wellData } from "../context/WellData";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as necessary
import { wellDataFromRawData } from "../../context/WellDataFileReader";

interface CylinderEntitiesProps {
    terrainProvider: CesiumTerrainProvider | undefined | null;
}

const PreMemoizedCylinderEntities: React.FC<CylinderEntitiesProps> = ({
    terrainProvider,
}) => {
    const heightWellShouldShowAboveSurface = 100;
    const [wellDataWithHeights, setWellDataWithHeights] =
        useState(wellDataFromRawData);
    const { setTooltipString, setTooltipX, setTooltipY } =
        useContext(TooltipContext);

    useEffect(() => {
        // Wait until the terrain provider is not undefined or null
        if (!terrainProvider) {
            console.log("Terrain provider is not ready yet");
            return;
        }

        const sampleTerrainHeights = async () => {
            const positions = wellDataFromRawData.map((well) =>
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

                // Create a new array with updated heights
                const newWellData = wellDataWithHeights.map(
                    (well, wellIndex) => {
                        const height = sampledPositions[wellIndex].height;
                        const layers = well.layers.map((layer) => ({
                            ...layer,
                            startDepth: height - layer.startDepth,
                            endDepth: height - layer.endDepth,
                        }));

                        return {
                            ...well,
                            layers,
                            startDepth: height - well.startDepth,
                            endDepth: height - well.endDepth,
                        };
                    }
                );

                // Update state with the new data, which will trigger a re-render
                setWellDataWithHeights(newWellData);
            } catch (error) {
                console.error("Error sampling terrain heights:", error);
            }
        };

        if (terrainProvider) {
            sampleTerrainHeights();
        }
    }, []); // Re-run this effect if the terrainProvider changes

    const handleMouseMove = (event: MouseEvent) => {
        // Update the position of the tooltip based on the mouse position
        // You can use event.clientX and event.clientY to get the mouse position
        // Update the tooltip position accordingly
        setTooltipX(event.clientX);
        setTooltipY(event.clientY);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            // Clean up the event listener when the component unmounts
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, []); // Empty dependency array to ensure the effect only runs once

    const handleMouseOver = useCallback(
        (index: number, layer: number) => {
            const description = wellDataWithHeights[index].metadata;
            setTooltipString(
                `Layer ${layer} of Cylinder ${index}: ${description}`
            );
        },
        [wellDataWithHeights, setTooltipString]
    );

    const handleMouseOut = useCallback(() => {
        setTooltipString("");
    }, [setTooltipString]);

    return (
        <>
            {wellDataWithHeights.map((well, wellIndex) => (
                <React.Fragment key={wellIndex}>
                    {well.layers.map((layer, layerIndex) => {
                        const layerStartPositionCartesian =
                            Cartesian3.fromDegrees(
                                well.longitude,
                                well.latitude,
                                layer.startDepth
                            );
                        // console.log(
                        //     "layer",
                        //     layerIndex,
                        //     " stateMetadata",
                        //     well.metadata,
                        //     " startDepth",
                        //     heightWellShouldShowAboveSurface + layer.startDepth,
                        //     "endDepth",
                        //     heightWellShouldShowAboveSurface + layer.endDepth
                        // );
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
                                    rotation={Math.toRadians(-40.0)}
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
            ))}
        </>
    );
};

const CylinderEntities = React.memo(PreMemoizedCylinderEntities);

// Memoize the component to prevent unnecessary re-renders
export default CylinderEntities;
