import {
    Cartesian3,
    Cartographic,
    CesiumTerrainProvider,
    Color,
    Math,
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
// import { wellData } from "../context/WellData";
import MapIcon from "../../assets/MapIcon.png";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as necessary
import { wellDataFromRawData } from "../../context/WellDataFileReader";

interface CylinderEntitiesProps {
    terrainProvider: CesiumTerrainProvider | undefined | null;
}

const PreMemoizedCylinderEntities: React.FC<CylinderEntitiesProps> = ({
    terrainProvider,
}) => {
    const heightWellShouldShowAboveSurface = 100;
    const heightMapIconShouldShowAboveWell = 20;
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
    }, [terrainProvider]); // Re-run this effect if the terrainProvider changes

    const handleMouseMove = (event: MouseEvent) => {
        // Update the position of the tooltip based on the mouse position
        setTooltipX(event.clientX);
        setTooltipY(event.clientY);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [handleMouseMove]);

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
            {wellDataWithHeights.map((well, wellIndex) => {
                // Ensure the well has layers and startDepth is defined
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
                            onMouseMove={() => handleMouseOver(wellIndex, 0)}
                            onMouseLeave={handleMouseOut}
                        >
                            <BillboardGraphics
                                image={MapIcon} // Replace with the correct path to MapIcon.png
                                verticalOrigin={VerticalOrigin.BOTTOM}
                                scaleByDistance={
                                    new NearFarScalar(1.5e2, 0.7, 1.5e5, 0.2) // Adjust scale based on distance
                                }
                            />
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
                );
            })}
        </>
    );
};

const CylinderEntities = React.memo(PreMemoizedCylinderEntities);

// Memoize the component to prevent unnecessary re-renders
export default CylinderEntities;
