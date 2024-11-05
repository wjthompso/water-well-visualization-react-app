import { Viewer as CesiumViewerInstance } from "cesium";
import React, { useRef } from "react";

interface ZoomControlsProps {
    viewer: CesiumViewerInstance | null;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ viewer }) => {
    const zoomInterval = 500; // Duration of zoom effect in milliseconds
    const minAltitude = 5000; // Minimum altitude above Earth in meters (5,000 meters)
    const maxAltitude = 1000000; // Maximum altitude above Earth in meters (1,000,000 meters)
    const zoomAnimationRef = useRef<number | null>(null);

    const calculateZoomStep = (currentHeight: number) => {
        // Adjust zoom step based on current height: smaller step when close, larger when far
        if (currentHeight < 2000) return 500; // Near the ground
        if (currentHeight < 10000) return 5000; // Low altitude
        if (currentHeight < 50000) return 2000; // Medium altitude
        if (currentHeight < 200000) return 4000; // High altitude
        return 8000; // Very high altitude
    };

    const smoothZoomIn = () => {
        if (!viewer) return;

        const animateZoomIn = (startTime: number) => {
            const currentHeight = viewer.camera.positionCartographic.height;

            if (currentHeight <= minAltitude) {
                if (zoomAnimationRef.current) {
                    cancelAnimationFrame(zoomAnimationRef.current);
                    zoomAnimationRef.current = null;
                }
                return;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / zoomInterval, 1);
            const zoomStep = calculateZoomStep(currentHeight) * progress;

            viewer.camera.zoomIn(zoomStep);

            if (progress < 1 && currentHeight - zoomStep > minAltitude) {
                zoomAnimationRef.current = requestAnimationFrame((time) =>
                    animateZoomIn(startTime)
                );
            } else {
                // Ensure we don't go below minAltitude
                const finalHeight = viewer.camera.positionCartographic.height;
                if (finalHeight < minAltitude) {
                    viewer.camera.zoomIn(finalHeight - minAltitude);
                }
                if (zoomAnimationRef.current) {
                    cancelAnimationFrame(zoomAnimationRef.current);
                    zoomAnimationRef.current = null;
                }
            }
        };

        if (zoomAnimationRef.current) {
            cancelAnimationFrame(zoomAnimationRef.current);
        }

        const startTime = performance.now();
        zoomAnimationRef.current = requestAnimationFrame(() =>
            animateZoomIn(startTime)
        );
    };

    const smoothZoomOut = () => {
        if (!viewer) return;

        const animateZoomOut = (startTime: number) => {
            const currentHeight = viewer.camera.positionCartographic.height;

            if (currentHeight >= maxAltitude) {
                if (zoomAnimationRef.current) {
                    cancelAnimationFrame(zoomAnimationRef.current);
                    zoomAnimationRef.current = null;
                }
                return;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / zoomInterval, 1);
            const zoomStep = calculateZoomStep(currentHeight) * progress;

            viewer.camera.zoomOut(zoomStep);

            if (progress < 1 && currentHeight + zoomStep < maxAltitude) {
                zoomAnimationRef.current = requestAnimationFrame((time) =>
                    animateZoomOut(startTime)
                );
            } else {
                // Ensure we don't exceed maxAltitude
                const finalHeight = viewer.camera.positionCartographic.height;
                if (finalHeight > maxAltitude) {
                    viewer.camera.zoomOut(maxAltitude - finalHeight);
                }
                if (zoomAnimationRef.current) {
                    cancelAnimationFrame(zoomAnimationRef.current);
                    zoomAnimationRef.current = null;
                }
            }
        };

        if (zoomAnimationRef.current) {
            cancelAnimationFrame(zoomAnimationRef.current);
        }

        const startTime = performance.now();
        zoomAnimationRef.current = requestAnimationFrame(() =>
            animateZoomOut(startTime)
        );
    };

    return (
        <div className="absolute z-20 flex flex-col gap-2 top-12 right-[calc(19rem+0.5rem)]">
            <button
                onClick={smoothZoomIn}
                className="flex items-center justify-center w-10 h-10 text-lg text-white rounded-md bg-headerBackgroundColor hover:bg-gray-600 border-borderColor border-[0.5px]"
            >
                +
            </button>
            <button
                onClick={smoothZoomOut}
                className="flex items-center justify-center w-10 h-10 text-lg text-white rounded-md bg-headerBackgroundColor hover:bg-gray-600 border-borderColor border-[0.5px]"
            >
                −
            </button>
        </div>
    );
};

export default ZoomControls;
