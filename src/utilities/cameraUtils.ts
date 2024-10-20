// src/utils/cameraUtils.ts

import {
    Cartesian3,
    Cartographic,
    Math as CesiumMath,
    Viewer as CesiumViewer,
} from "cesium";

/**
 * Moves the camera to Dangermond with predefined settings.
 * @param viewer - The CesiumViewer instance.
 */
export const moveCameraToDangermond = (viewer: CesiumViewer): void => {
    const CAMERA_LONGITUDE = -120.432283;
    const CAMERA_LATITUDE = 34.454167;
    const CAMERA_HEIGHT = 5000;
    const CAMERA_HEADING = 0;
    const CAMERA_PITCH = -60;

    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(
            CAMERA_LONGITUDE,
            CAMERA_LATITUDE,
            CAMERA_HEIGHT
        ),
        orientation: {
            heading: CesiumMath.toRadians(CAMERA_HEADING),
            pitch: CesiumMath.toRadians(CAMERA_PITCH),
            roll: 0.0,
        },
    });
};

/**
 * Enables underground view by enabling collision detection.
 * @param viewer - The CesiumViewer instance.
 */
export const enableUndergroundView = (viewer: CesiumViewer): void => {
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
};

/**
 * Makes the ground translucent based on the camera's height above terrain.
 * @param viewer - The CesiumViewer instance.
 * @returns A cleanup function to remove the event listener.
 */
export const makeGroundTranslucentAsYouGetCloser = (
    viewer: CesiumViewer
): (() => void) => {
    const globe = viewer.scene.globe;
    globe.depthTestAgainstTerrain = true;
    globe.translucency.enabled = true;
    const scene = viewer.scene;

    const handleCameraChange = () => {
        const cameraCartographic = Cartographic.fromCartesian(
            scene.camera.position
        );

        const terrainHeight = globe.getHeight(cameraCartographic);
        const terrainElevation =
            terrainHeight !== undefined ? terrainHeight : 0;
        const cameraHeightAboveTerrain =
            cameraCartographic.height - terrainElevation;

        if (cameraHeightAboveTerrain < 500) {
            viewer.scene.globe.maximumScreenSpaceError = 8;
            globe.translucency.frontFaceAlpha = 0.2;
        } else if (cameraHeightAboveTerrain < 2000) {
            viewer.scene.globe.maximumScreenSpaceError = 4;
            globe.translucency.frontFaceAlpha = 0.5;
        } else {
            viewer.scene.globe.maximumScreenSpaceError = 2;
            globe.translucency.frontFaceAlpha = 1;
        }
    };

    scene.camera.changed.addEventListener(handleCameraChange);
    handleCameraChange();

    return () => {
        scene.camera.changed.removeEventListener(handleCameraChange);
    };
};

/**
 * Decreases the level of detail in the globe rendering.
 * @param viewer - The CesiumViewer instance.
 */
export const decreaseLevelOfDetail = (viewer: CesiumViewer): void => {
    viewer.scene.globe.maximumScreenSpaceError = 6;
};
