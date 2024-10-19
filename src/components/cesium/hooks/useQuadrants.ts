// src/components/cesium/hooks/useQuadrants.ts

import { useEffect, useRef } from "react";
import { fetchQuadrants } from "../../../utilities/api";
import { Chunk } from "../types";

/**
 * useQuadrants Hook
 *
 * Summary:
 * Fetches and manages quadrant data, storing it in refs for efficient access.
 *
 * Details:
 * This hook fetches quadrant data from the server upon initial render and stores it in a
 * mutable ref object to prevent unnecessary re-fetching. It also maintains a Map for
 * quick lookup of quadrants based on their keys. The hook ensures that quadrants are
 * fetched only once during the application's lifecycle.
 *
 * Usage:
 * ```typescript
 * const { quadrantsRef, quadrantsMapRef } = useQuadrants();
 * ```
 *
 * @returns An object containing refs for quadrants array and quadrants map.
 */
const useQuadrants = () => {
    const quadrantsRef = useRef<Chunk[]>([]);
    const quadrantsMapRef = useRef<Map<string, Chunk>>(new Map());
    const hasFetched = useRef<boolean>(false);

    useEffect(() => {
        const getQuadrants = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;
            try {
                const quadrants: Chunk[] = await fetchQuadrants();
                quadrantsRef.current = quadrants;

                quadrantsMapRef.current = new Map(
                    quadrants.map((chunk) => {
                        const topLeftLat = Number(chunk.topLeft.lat.toFixed(6));
                        const topLeftLon = Number(chunk.topLeft.lon.toFixed(6));
                        const bottomRightLat = Number(
                            chunk.bottomRight.lat.toFixed(6)
                        );
                        const bottomRightLon = Number(
                            chunk.bottomRight.lon.toFixed(6)
                        );
                        const chunkKey = `${topLeftLat},${topLeftLon}-${bottomRightLat},${bottomRightLon}`;
                        return [chunkKey, chunk];
                    })
                );
            } catch (error) {
                console.error("Error fetching quadrants:", error);
            }
            console.log("Quadrants fetched:", quadrantsRef.current);
        };

        getQuadrants();
    }, []);

    return { quadrantsRef, quadrantsMapRef };
};

export default useQuadrants;
