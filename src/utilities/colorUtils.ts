// utilities/colorUtils.ts

import { Color } from "cesium";

/**
 * Interpolates between two colors based on a normalized value.
 * @param value - The current value.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A Cesium Color object representing the interpolated color.
 */
export const getGradientColor = (
    value: number,
    min: number,
    max: number
): Color => {
    // Clamp the value between min and max
    const clampedValue = Math.max(min, Math.min(value, max));

    // Normalize the value between 0 and 1
    const normalized = (clampedValue - min) / (max - min);

    // Define the start (gray) and end (blue) colors
    const startColor = Color.GRAY; // Cesium's predefined gray
    const endColor = Color.fromCssColorString("#053B64");

    // Interpolate each color channel
    const r = startColor.red + normalized * (endColor.red - startColor.red);
    const g =
        startColor.green + normalized * (endColor.green - startColor.green);
    const b = startColor.blue + normalized * (endColor.blue - startColor.blue);
    const a =
        startColor.alpha + normalized * (endColor.alpha - startColor.alpha);

    return new Color(r, g, b, a);
};
