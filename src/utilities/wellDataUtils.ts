// src/utils/wellDataUtils.ts

import {
    GroundMaterialType,
    GroundMaterialTypeColor,
    Layer,
    RawLayer,
    RawWellData,
    WellData,
} from "../components/cesium/types";
import { mapMaterialColor, mapMaterialType } from "./materialUtils";

/**
 * Processes raw well data into structured WellData.
 * @param rawData - Array of RawWellData.
 * @returns Array of WellData.
 */
export const processRawWellData = (rawData: RawWellData[]): WellData[] => {
    return rawData.map((data) => {
        const layers: Layer[] = data.layers.map((layer: RawLayer) => {
            const materialType: keyof typeof GroundMaterialType =
                mapMaterialType(layer[3]);
            const color: GroundMaterialTypeColor =
                mapMaterialColor(materialType);

            return {
                type: [GroundMaterialType[materialType]],
                color: color,
                startDepth: layer[0],
                endDepth: layer[1],
                unAdjustedEndDepth: layer[1],
                unAdjustedStartDepth: layer[0],
                description: layer[2],
            };
        });

        return {
            longitude: data.lon,
            latitude: data.lat,
            startDepth: 0,
            endDepth: layers[layers.length - 1].endDepth,
            StateWellID: data.well_id,
            drillNotesPDF: data.drill_notes_pdf,
            layers: layers,
        };
    });
};

/**
 * Fills in missing layers in WellData with default "NA" layers.
 * @param wellData - Array of WellData.
 * @returns Array of WellData with filled layers.
 */
export const fillInMissingLayers = (wellData: WellData[]): WellData[] => {
    return wellData.map((well) => {
        const filledLayers: Layer[] = [];
        let currentDepth = well.startDepth;

        well.layers.forEach((layer) => {
            if (layer.startDepth > currentDepth) {
                filledLayers.push({
                    type: [GroundMaterialType.NA],
                    color: GroundMaterialTypeColor.NA,
                    startDepth: currentDepth,
                    endDepth: layer.startDepth,
                    unAdjustedEndDepth: layer.startDepth,
                    unAdjustedStartDepth: currentDepth,
                    description: "NA",
                });
            }
            filledLayers.push(layer);
            currentDepth = layer.endDepth;
        });

        if (currentDepth < well.endDepth) {
            filledLayers.push({
                type: [GroundMaterialType.NA],
                color: GroundMaterialTypeColor.NA,
                startDepth: currentDepth,
                endDepth: well.endDepth,
                unAdjustedEndDepth: well.endDepth,
                unAdjustedStartDepth: currentDepth,
                description: "NA",
            });
        }

        return {
            ...well,
            layers: filledLayers,
        };
    });
};

/**
 * Type guard to check if data is SubChunkedWellData.
 * @param data - The data to check.
 * @returns True if data is SubChunkedWellData, false otherwise.
 */
export const isSubChunkedData = (
    data:
        | RawWellData[]
        | { sub_chunks: { location: any; wells: RawWellData[] }[] }
): data is { sub_chunks: { location: any; wells: RawWellData[] }[] } => {
    return (data as { sub_chunks: any }).sub_chunks !== undefined;
};
