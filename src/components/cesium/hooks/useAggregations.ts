// src/components/cesium/hooks/useAggregations.ts

import Cesium, { Cartographic } from "cesium";
import { useEffect } from "react";

/**
 * useAggregations Hook
 *
 * Summary:
 * Controls the visibility of state and county aggregations based on the camera's height.
 *
 * Details:
 * This hook listens to changes in the camera's position and toggles the visibility of
 * aggregations (such as state and county-level data) when the camera height crosses
 * a predefined threshold. It ensures that aggregations are displayed only when appropriate,
 * enhancing performance and user experience.
 *
 * Usage:
 * ```typescript
 * useAggregations(camera, thresholdHeight, setShowAggregations);
 * ```
 *
 * @param camera - The Cesium Camera instance.
 * @param thresholdHeight - The height threshold in meters to toggle aggregations.
 * @param setShowAggregations - State setter to control aggregation visibility.
 */
const useAggregations = (
    camera: Cesium.Camera,
    thresholdHeight: number,
    setShowAggregations: React.Dispatch<React.SetStateAction<boolean>>
) => {
    useEffect(() => {
        const handleAggregationVisibility = () => {
            const cameraCartographic = Cartographic.fromCartesian(
                camera.position
            );
            const cameraHeight = cameraCartographic.height;
            const newShowAggregations = cameraHeight <= thresholdHeight;

            setShowAggregations(newShowAggregations);
        };

        camera.changed.addEventListener(handleAggregationVisibility);
        handleAggregationVisibility();

        return () => {
            camera.changed.removeEventListener(handleAggregationVisibility);
        };
    }, [camera, thresholdHeight, setShowAggregations]);
};

export default useAggregations;
