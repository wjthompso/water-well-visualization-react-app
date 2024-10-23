// utils/csvUtils.ts
export const convertWellDataToCSV = (selectedWellData: any): string => {
    if (!selectedWellData) return "";

    const { layers } = selectedWellData;

    // Add headers for the layer-specific data
    let csv = "Layer Type,Start Depth,End Depth,Driller Notes\n";
    layers.forEach((layer: any) => {
        const layerTypes = layer.type.join("; "); // Join multiple types
        const description = `"${
            layer.description?.replace(/"/g, '""') || "N/A"
        }"`; // Escape double quotes and wrap in quotes
        csv += `${layerTypes},${layer.unAdjustedStartDepth},${layer.unAdjustedEndDepth},${description}\n`;
    });

    return csv;
};
