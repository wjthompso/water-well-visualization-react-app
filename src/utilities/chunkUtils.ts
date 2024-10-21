// src/utils/chunkUtils.ts

import { Cartesian3 } from "cesium";
import { Chunk } from "../components/cesium/types";

/**
 * Creates a unique location key for a given chunk.
 * @param chunk - The chunk object containing topLeft and bottomRight coordinates.
 * @returns A string representing the location key.
 */
export const createLocationKey = (chunk: Chunk): string => {
    const { topLeft, bottomRight } = chunk;
    return `location:(${topLeft.lat}, ${topLeft.lon})-(${bottomRight.lat}, ${bottomRight.lon})`;
};

/**
 * Calculates the chunk key and chunk data based on latitude and longitude.
 * Ensures the indices are within bounds.
 * @param lat - Current latitude.
 * @param lon - Current longitude.
 * @param minLat - Minimum latitude boundary.
 * @param minLon - Minimum longitude boundary.
 * @param latStep - Latitude step size.
 * @param lonStep - Longitude step size.
 * @param chunkSplitN - Number of splits.
 * @returns An object containing the chunk key and chunk data.
 */
export const calculateChunkKey = (
    lat: number,
    lon: number,
    minLat: number,
    minLon: number,
    latStep: number,
    lonStep: number,
    chunkSplitN: number
): { chunkKey: string; chunk: Chunk } => {
    let latIndex = Math.floor((lat - minLat) / latStep);
    let lonIndex = Math.floor((lon - minLon) / lonStep);

    latIndex = Math.min(Math.max(latIndex, 0), chunkSplitN - 1);
    lonIndex = Math.min(Math.max(lonIndex, 0), chunkSplitN - 1);

    const topLeftLat = Number((minLat + latIndex * latStep).toFixed(6));
    const topLeftLon = Number((minLon + lonIndex * lonStep).toFixed(6));
    const bottomRightLat = Number(
        (minLat + (latIndex + 1) * latStep).toFixed(6)
    );
    const bottomRightLon = Number(
        (minLon + (lonIndex + 1) * lonStep).toFixed(6)
    );

    const chunkKey = `${topLeftLat},${topLeftLon}-${bottomRightLat},${bottomRightLon}`;
    const chunk: Chunk = {
        topLeft: { lat: topLeftLat, lon: topLeftLon },
        bottomRight: { lat: bottomRightLat, lon: bottomRightLon },
    };

    return { chunkKey, chunk };
};

/**
 * Computes the chunk outline positions based on the current quadrant.
 *
 * @param currentQuadrant - The current chunk quadrant.
 * @returns An array of Cartesian3 positions or null if currentQuadrant is not provided.
 */
export const computeChunkOutlinePositions = (
    currentQuadrant: Chunk | null | undefined
): Cartesian3[] | null => {
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
};
