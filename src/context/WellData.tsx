// export enum GroundMaterialType {
//     Adobe = "Adobe",
//     Basalt = "Basalt",
//     Clay = "Clay",
//     Conglomerate = "Conglomerate",
//     Dolomite = "Dolomite",
//     Granite = "Granite",
//     Gravel = "Gravel",
//     Gypsum = "Gypsum",
//     Limestone = "Limestone",
//     NA = "NA",
//     Quartzite = "Quartzite",
//     Rock = "Rock",
//     Sand = "Sand",
//     Sandstone = "Sandstone",
//     Shale = "Shale",
//     Siltstone = "Siltstone",
//     Soil = "Soil",
// }

// export enum GroundMaterialTypeColor {
//     Adobe = "#FFD800",
//     Basalt = "#000000",
//     Clay = "#FFA07A",
//     Conglomerate = "#8B0000",
//     Dolomite = "#FF4500",
//     Granite = "#808080",
//     Gravel = "#D3D3D3",
//     Gypsum = "#FF0000",
//     Limestone = "#00FF00",
//     NA = "#FFFFFF",
//     Rock = "#A9A9B11",
//     Quartzite = "#800000",
//     Sand = "#C2B280",
//     Sandstone = "#FFD700",
//     Shale = "#A9A9A9",
//     Siltstone = "#FF6347",
//     Soil = "#FFFF00",
// }

export enum GroundMaterialType {
    UCG = "1 Unconsolidated: Coarse-grained material",
    UMC = "2 Unconsolidated: Mostly coarse-grained material",
    UMIX = "3 Unconsolidated: Mixture of coarse and fine grained",
    UFC = "4 Unconsolidated: Mostly fine-grained material",
    UFG = "5 Unconsolidated: Fine grained material",
    TILL = "6 Till/drift",
    CCG = "7 Consolidated: Coarse-grained material",
    CMCG = "8 Consolidated: Mostly coarse-grained material",
    CMIX = "9 Consolidated: Mixture of coarse and fine grained",
    CMFC = "10 Consolidated: Mostly fine-grained low-permeability",
    CFGP = "11 Consolidated: Fine grained low-permeability",
    CARB = "12 Mostly carbonate rock",
    ENDO = "13 Endogenous",
    VOLC = "14 Volcanic",
    EVAP = "15 Evaporites",
    NA = "NA",
}

export enum GroundMaterialTypeColor {
    UCG = "#8B4513", // SaddleBrown
    UMC = "#A0522D", // Sienna
    UMIX = "#CD853F", // Peru
    UFC = "#DEB887", // BurlyWood
    UFG = "#F4A460", // SandyBrown
    //
    TILL = "#808080", // Gray
    //
    CCG = "#FFCDD2", // Light Pink
    CMCG = "#EF9A9A", // Salmon
    CMIX = "#E57373", // Light Coral
    CMFC = "#D9534F", // Crimson
    CFGP = "#C64B4B", // Dark Red
    //
    CARB = "#B0C4DE", // LightSteelBlue
    ENDO = "#5F9EA0", // CadetBlue
    VOLC = "#483D8B", // DarkSlateBlue
    EVAP = "#4682B4", // SteelBlue
    NA = "#FFFFFF", // White
}

export interface Layer {
    type: GroundMaterialType[];
    color: GroundMaterialTypeColor;
    startDepth: number;
    endDepth: number;
    unAdjustedStartDepth: number;
    unAdjustedEndDepth: number;
    description?: string | null;
}

export interface WellData {
    longitude: number;
    latitude: number;
    startDepth: number;
    endDepth: number;
    layers: Layer[];
    StateWellID?: string | null;
    metadata?: string | null;
}

export const dangermondPosition = {
    longitude: -120.452283,
    latitude: 34.464167,
};

// export const wellData: WellData[] = [
//     {
//         longitude: -120.452283 - 0.016,
//         latitude: 34.464167 - 0.016,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the fourth well.",
//     },
//     {
//         longitude: -120.452283,
//         latitude: 34.464167,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the first well.",
//     },
//     {
//         longitude: -120.452283 + 0.01,
//         latitude: 34.464167,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the second well.",
//     },
//     {
//         longitude: -120.452283,
//         latitude: 34.464167 + 0.01,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the third well",
//     },
//     {
//         longitude: -120.452283 + 0.01,
//         latitude: 34.464167 + 0.01,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the fourth well.",
//     },
//     {
//         longitude: -120.452283 + 0.015,
//         latitude: 34.464167 + 0.015,
//         startDepth: 0,
//         endDepth: 100,
//         layers: [
//             {
//                 type: [GroundMaterialType.Sandstone],
//                 color: GroundMaterialTypeColor.Sandstone,
//                 startDepth: 0,
//                 endDepth: 20,
//             },
//             {
//                 type: [GroundMaterialType.Limestone],
//                 color: GroundMaterialTypeColor.Limestone,
//                 startDepth: 20,
//                 endDepth: 40,
//             },
//             {
//                 type: [GroundMaterialType.Shale],
//                 color: GroundMaterialTypeColor.Shale,
//                 startDepth: 40,
//                 endDepth: 60,
//             },
//             {
//                 type: [GroundMaterialType.Granite],
//                 color: GroundMaterialTypeColor.Granite,
//                 startDepth: 60,
//                 endDepth: 80,
//             },
//             {
//                 type: [GroundMaterialType.Basalt],
//                 color: GroundMaterialTypeColor.Basalt,
//                 startDepth: 80,
//                 endDepth: 100,
//             },
//         ],
//         metadata: "This is the fourth well.",
//     },
// ];
