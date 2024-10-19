// src/utils/materialUtils.ts

import {
    GroundMaterialType,
    GroundMaterialTypeColor,
} from "../components/cesium/types";

/**
 * Maps a material string to the corresponding GroundMaterialType enum key.
 * @param material - The material string to map.
 * @returns The corresponding GroundMaterialType key or "NA" if not found.
 */
export const mapMaterialType = (
    material: string
): keyof typeof GroundMaterialType => {
    const cleanedMaterial = material.trim().toUpperCase();
    if (cleanedMaterial in GroundMaterialType) {
        return cleanedMaterial as keyof typeof GroundMaterialType;
    }
    return "NA";
};

/**
 * Maps a GroundMaterialType key to its corresponding color.
 * @param materialKey - The GroundMaterialType key.
 * @returns The corresponding GroundMaterialTypeColor.
 */
export const mapMaterialColor = (
    materialKey: keyof typeof GroundMaterialType
): GroundMaterialTypeColor => {
    return GroundMaterialTypeColor[materialKey] || GroundMaterialTypeColor.NA;
};
