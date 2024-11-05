import * as Cesium from "cesium";
import { Viewer as CesiumViewerInstance } from "cesium";
import React from "react";

interface ZoomControlsProps {
    viewer: CesiumViewerInstance | null;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ viewer }) => {
    const minAltitude = 5_000; // Minimum altitude above Earth in meters (5,000 meters)
    const maxAltitude = 6_000_000; // Maximum altitude above Earth in meters (6,000,000 meters)

    // Define zoom levels in ascending order (from closest to farthest)
    const zoomLevels = [5_000, 75_000, 300_000, 950_000, 3_000_000, 6_000_000];

    /**
     * Finds the current zoom level index based on the camera's altitude.
     * @returns The index of the current zoom level.
     */
    const getCurrentZoomIndex = (): number => {
        if (!viewer) return -1;
        const currentHeight = Math.round(
            viewer.camera.positionCartographic.height
        );

        // Find the first zoom level that is greater than the current height
        for (let i = 0; i < zoomLevels.length; i++) {
            if (currentHeight <= zoomLevels[i]) {
                return i;
            }
        }

        // If current height exceeds all zoom levels, return the last index
        return zoomLevels.length - 1;
    };

    /**
     * Zooms the camera in to the next lower zoom level.
     */
    const zoomIn = () => {
        if (!viewer) return;
        const currentIndex = getCurrentZoomIndex();
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;

        // Prevent zooming in beyond the minimum altitude
        if (newIndex === currentIndex) return;

        const targetHeight = zoomLevels[newIndex];
        const currentPosition = viewer.camera.positionCartographic;

        // Calculate the new camera position with the target height
        const destination = Cesium.Cartesian3.fromRadians(
            currentPosition.longitude,
            currentPosition.latitude,
            targetHeight
        );

        // Fly the camera to the new position
        viewer.camera.flyTo({
            destination,
            duration: 0.6, // Duration in seconds
            easingFunction: Cesium.EasingFunction.EXPONENTIAL_IN_OUT,
        });
    };

    /**
     * Zooms the camera out to the next higher zoom level.
     */
    const zoomOut = () => {
        if (!viewer) return;
        const currentIndex = getCurrentZoomIndex();
        const newIndex =
            currentIndex < zoomLevels.length - 1
                ? currentIndex + 1
                : zoomLevels.length - 1;

        // Prevent zooming out beyond the maximum altitude
        if (newIndex === currentIndex) return;

        const targetHeight = zoomLevels[newIndex];
        const currentPosition = viewer.camera.positionCartographic;

        // Calculate the new camera position with the target height
        const destination = Cesium.Cartesian3.fromRadians(
            currentPosition.longitude,
            currentPosition.latitude,
            targetHeight
        );

        // Fly the camera to the new position
        viewer.camera.flyTo({
            destination,
            duration: 0.6, // Duration in seconds
            easingFunction: Cesium.EasingFunction.EXPONENTIAL_IN_OUT,
        });
    };

    return (
        <div className="absolute z-20 flex flex-col gap-2 top-12 left-2 md:left-auto md:right-[calc(19rem+0.5rem)]">
            <button
                onClick={zoomIn}
                className="flex items-center justify-center w-9 h-9 text-lg text-white rounded-md bg-headerBackgroundColor hover:bg-gray-600 border-borderColor border-[0.5px]"
                aria-label="Zoom In"
            >
                +
            </button>
            <button
                onClick={zoomOut}
                className="flex items-center justify-center w-9 h-9 text-lg text-white rounded-md bg-headerBackgroundColor hover:bg-gray-600 border-borderColor border-[0.5px]"
                aria-label="Zoom Out"
            >
                −
            </button>
        </div>
    );
};

export default ZoomControls;
