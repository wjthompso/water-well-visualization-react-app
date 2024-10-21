// src/components/cesium/hooks/useTerrainData.ts

import { CesiumTerrainProvider, createWorldTerrainAsync } from "cesium";
import { useEffect, useRef, useState } from "react";

/**
 * useTerrainData Hook
 *
 * Summary:
 * Manages the loading and state of Cesium terrain data.
 *
 * Details:
 * This hook asynchronously loads Cesium's world terrain data and provides the terrain provider
 * to the consuming component. It maintains a loading state to handle UI feedback during the
 * asynchronous operation and ensures that terrain data is loaded only once.
 *
 * Usage:
 * ```typescript
 * const { terrainProvider, isLoading } = useTerrainData();
 * ```
 *
 * @returns An object containing the terrain provider and loading state.
 */
const useTerrainData = () => {
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const hasLoaded = useRef<boolean>(false);

    useEffect(() => {
        const loadTerrain = async () => {
            if (hasLoaded.current) return;
            hasLoaded.current = true;
            try {
                const terrain = await createWorldTerrainAsync({
                    requestWaterMask: false,
                    requestVertexNormals: false,
                });
                setTerrainProvider(terrain);
            } catch (error) {
                console.error("Error loading terrain data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTerrain();
    }, []);

    return { terrainProvider, isLoading };
};

export default useTerrainData;
