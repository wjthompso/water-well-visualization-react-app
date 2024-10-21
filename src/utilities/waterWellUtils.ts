// src/utilities/WaterWellsUtils.ts

import { Cartographic, Globe } from "cesium";
import { SubChunk, WellData } from "../components/cesium/types";

/**
 * Determines if the provided data is sub-chunked.
 * @param data - The well data input.
 * @returns True if data is sub-chunked, false otherwise.
 */
export const isSubChunkedData = (
    data: WellData[] | { sub_chunks: SubChunk[] }
): data is { sub_chunks: SubChunk[] } => {
    return (data as { sub_chunks: SubChunk[] }).sub_chunks !== undefined;
};

/**
 * Serializes a sub-chunk's location into a unique string key.
 * @param subChunk - The sub-chunk to serialize.
 * @returns A unique string key representing the sub-chunk's location.
 */
export const serializeSubChunkKey = (subChunk: SubChunk): string => {
    const { topLeft, bottomRight } = subChunk.location;
    return `${topLeft.lat.toFixed(6)},${topLeft.lon.toFixed(
        6
    )}-${bottomRight.lat.toFixed(6)},${bottomRight.lon.toFixed(6)}`;
};

/**
 * Processes terrain heights for a given sub-chunk.
 * @param subChunk - The sub-chunk containing wells.
 * @param globe - The Cesium globe to retrieve terrain heights.
 * @returns An array of WellData with adjusted heights.
 */
export const processTerrainHeightsForSubChunk = (
    subChunk: SubChunk,
    globe: Globe
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
            // Optionally, set a default height or skip this well
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
