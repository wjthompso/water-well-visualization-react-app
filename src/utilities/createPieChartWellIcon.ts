// createPieChartWellIcon.ts

import { Layer, WellData } from "../components/cesium/types";

// Initialize a cache to store generated pie chart data URLs
const pieChartCache: Map<string, string> = new Map();

/**
 * Creates a pie chart icon representing the composition of well layers.
 * @param well - The well data containing layers with depth and color information.
 * @returns A data URL representing the pie chart image.
 */
export function createPieChartWellIcon(well: WellData): string {
    // Ensure that StateWellID is non-null
    const wellID: string = well.StateWellID ?? "";

    if (!wellID) {
        console.warn("Well ID is missing. Using default icon.");
        return createDefaultIcon(50);
    }

    // Return cached data URL if available
    if (pieChartCache.has(wellID)) {
        return pieChartCache.get(wellID)!;
    }

    const baseSize: number = 50;
    const scaleFactor: number = 1;
    const radius: number = baseSize * scaleFactor;
    const centerX: number = radius;
    const centerY: number = radius;

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

    canvas.width = radius * 2;
    canvas.height = radius * 2;

    if (!ctx) {
        console.warn("Canvas not supported. Using default icon.");
        const dataUrl = createDefaultIcon(radius);
        pieChartCache.set(wellID, dataUrl);
        return dataUrl;
    }

    const firstLayer = well.layers[0];
    const lastLayer = well.layers[well.layers.length - 1];
    const totalDepth: number = Math.abs(
        lastLayer.unAdjustedEndDepth - firstLayer.unAdjustedStartDepth
    );

    if (totalDepth <= 0) {
        console.warn(
            `Invalid total depth for well ID ${wellID}. Using default icon.`
        );
        const dataUrl = createDefaultIcon(radius);
        pieChartCache.set(wellID, dataUrl);
        return dataUrl;
    }

    // Group layers by color and sum their depths
    const colorSumMap: Map<string, number> = new Map();

    well.layers.forEach((layer: Layer) => {
        const layerDepth: number =
            layer.unAdjustedEndDepth - layer.unAdjustedStartDepth;
        if (layerDepth > 0) {
            colorSumMap.set(
                layer.color,
                (colorSumMap.get(layer.color) ?? 0) + layerDepth
            );
        }
    });

    if (colorSumMap.size === 0) {
        console.warn(
            `No valid layers for well ID ${wellID}. Using default icon.`
        );
        const dataUrl = createDefaultIcon(radius);
        pieChartCache.set(wellID, dataUrl);
        return dataUrl;
    }

    // Calculate fractions and prepare slices
    const slices: { color: string; fraction: number }[] = [];
    colorSumMap.forEach((sumDepth, color) => {
        slices.push({
            color,
            fraction: sumDepth / totalDepth,
        });
    });

    // Normalize fractions to ensure they sum to 1
    const totalFraction: number = slices.reduce(
        (sum, slice) => sum + slice.fraction,
        0
    );
    const precision: number = 1e-6;

    if (Math.abs(totalFraction - 1) > precision) {
        slices.forEach((slice) => {
            slice.fraction /= totalFraction;
        });
    }

    // Draw the pie chart
    let currentAngle: number = 0;

    slices.forEach((slice, index) => {
        const sliceAngle: number = slice.fraction * 2 * Math.PI;
        const isLastSlice: boolean = index === slices.length - 1;
        const finalAngle: number = isLastSlice
            ? 2 * Math.PI
            : currentAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, finalAngle);
        ctx.closePath();

        ctx.fillStyle = slice.color;
        ctx.fill();

        currentAngle += sliceAngle;
    });

    // Handle any minor discrepancies
    if (currentAngle < 2 * Math.PI - precision) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, 2 * Math.PI);
        ctx.closePath();

        ctx.fillStyle = "#CCCCCC"; // Default gray color
        ctx.fill();
    }

    const dataUrl: string = canvas.toDataURL("image/png");
    pieChartCache.set(wellID, dataUrl);

    return dataUrl;
}

/**
 * Creates a default gray icon.
 * @param radius - The radius of the circle.
 * @returns A data URL representing the default icon.
 */
function createDefaultIcon(radius: number): string {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    canvas.width = radius * 2;
    canvas.height = radius * 2;

    if (ctx) {
        const centerX: number = radius;
        const centerY: number = radius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#CCCCCC"; // Default gray color
        ctx.fill();
        return canvas.toDataURL("image/png");
    } else {
        return ""; // Fallback if canvas is not supported
    }
}
