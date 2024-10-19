// src/utils/api.ts

import {
    Chunk,
    RawWellData,
    SubChunkLocation,
} from "../components/cesium/types";

/**
 * Fetches quadrant data from the server.
 * @returns Promise resolving to an array of Chunk objects.
 */
export const fetchQuadrants = async (): Promise<Chunk[]> => {
    const response = await fetch("http://localhost:3000/keys");
    if (!response.ok) {
        throw new Error(`Failed to fetch quadrants: ${response.statusText}`);
    }
    const chunks: Chunk[] = await response.json();
    return chunks;
};

/**
 * Fetches well data based on the provided location key.
 * @param locationKey - The key representing the location.
 * @returns Promise resolving to RawWellData array or SubChunkedWellData.
 */
export const fetchWellData = async (
    locationKey: string
): Promise<
    | RawWellData[]
    | { sub_chunks: { location: SubChunkLocation; wells: RawWellData[] }[] }
> => {
    const response = await fetch("http://localhost:3000/keys", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: locationKey }),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch well data: ${response.statusText}`);
    }

    const wellData = await response.json();
    return wellData;
};
