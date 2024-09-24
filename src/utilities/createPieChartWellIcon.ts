import { WellData } from "../context/WellData";

const pieChartCache = new Map<string, string>();

export function createPieChartWellIcon(well: WellData): string {
    // Check if the result is already cached
    const wellID = well.StateWellID ?? '';
    if (pieChartCache.has(wellID)) {
        return pieChartCache.get(wellID)!;
    }
    const baseSize = 50;
    const scaleFactor = 0.5; // Try a lower value
    const radius = baseSize * scaleFactor;
    const centerX = radius;
    const centerY = radius;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = radius * 2;
    canvas.height = radius * 2;

    if (!ctx) {
        throw new Error("Canvas not supported");
    }

    // Group slices by color and sum up their fractions
    const groupedSlices: { color: string; fraction: number }[] = [];

    well.layers.forEach((layer) => {
        const fraction =
            (layer.endDepth - layer.startDepth) /
            (well.endDepth - well.startDepth);
        const existingSlice = groupedSlices.find(
            (slice) => slice.color === layer.color
        );

        if (existingSlice) {
            existingSlice.fraction += fraction; // Combine fractions
        } else {
            groupedSlices.push({ color: layer.color, fraction });
        }
    });

    // Check if there's only one grouped slice (all layers have the same color)
    if (groupedSlices.length === 1) {
        // Fill the entire circle with that one color
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = groupedSlices[0].color;
        ctx.fill();
    } else {
        let currentAngle = 0;

        // Draw the grouped slices
        groupedSlices.forEach((slice) => {
            const sliceAngle = slice.fraction * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
                centerX,
                centerY,
                radius,
                currentAngle,
                currentAngle + sliceAngle
            );
            ctx.closePath();

            ctx.fillStyle = slice.color;
            ctx.fill();

            currentAngle += sliceAngle;
        });
    }

    // Convert high-res canvas to PNG URL
    const dataUrl = canvas.toDataURL("image/png");

    // Store the result in the cache
    pieChartCache.set(wellID, dataUrl);

    return dataUrl;
}
