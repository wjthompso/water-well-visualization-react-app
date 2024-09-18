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
    UCG = "Unconsolidated: Coarse-grained",
    UMC = "Unconsolidated: Mostly coarse-grained",
    UMIX = "Unconsolidated: Mixture of coarse and fine grained",
    UFC = "Unconsolidated: Mostly fine-grained",
    UFG = "Unconsolidated: Fine grained",
    TILL = "Till/drift",
    CCG = "Consolidated: Coarse-grained",
    CMCG = "Consolidated: Mostly coarse-grained",
    CMIX = "Consolidated: Coarse & fine grained mix",
    CMFC = "Consolidated: Mostly fine-grained",
    CFGP = "Consolidated: Fine grained",
    CARB = "Mostly carbonate rock",
    ENDO = "Endogenous",
    VOLC = "Volcanic",
    EVAP = "Evaporites",
    NA = "NA",
}

export enum GroundMaterialTypeColor {
    UCG = "#002347", // Dark blue
    UMC = "#003B77", // 003B7
    UMIX = "#005AB5", // Peru
    UFC = "#4C93DC", // BurlyWood
    UFG = "#9CC4ED", // SandyBrown
    //
    //
    CCG = "#620000", // Light Pink
    CMCG = "#AF0C0C", // Salmon
    CMIX = "#FF0000", // Light Coral
    CMFC = "#FF413C", // Crimson
    CFGP = "#FF9390 ", // Dark Red
    //
    TILL = "#FF0084", // Gray
    CARB = "#41FDFE", // LightSteelBlue
    VOLC = "#45BE44", // DarkSlateBlue
    EVAP = "#F8E627", // SteelBlue
    ENDO = "#884B9E", // CadetBlue
    NA = "#FFFFFF", // White
}

export enum TailwindGroundMaterialTypeColor {
    UNC_COARSE = "bg-[#002347]", // Dark blue (UCG)
    UNC_MOSTLY_COARSE = "bg-[#003B77]", // Medium blue (UMC)
    UNC_MIX_COARSE_FINE = "bg-[#005AB5]", // Bright blue (UMIX)
    UNC_MOSTLY_FINE = "bg-[#4C93DC]", // Light blue (UFC)
    UNC_FINE = "bg-[#9CC4E4]", // Very light blue (UFG)
    //
    TILL = "bg-[#FF0084]", // Pink (TILL)
    //
    CONS_COARSE = "bg-[#620000]", // Dark red (CCG)
    CONS_MOSTLY_COARSE = "bg-[#AF0C0C]", // Medium red (CMCG)
    CONS_MIX_COARSE_FINE = "bg-[#FF0000]", // Bright red (CMIX)
    CONS_MOSTLY_FINE = "bg-[#FF413C]", // Light red (CMFC)
    CONS_FINE = "bg-[#FF9390]", // Very light red (CFGP)
    //
    CARBONATE = "bg-[#41FDFE]", // Cyan (CARB)
    ENDOGENOUS = "bg-[#884B9E]", // Purple (ENDO)
    VOLCANIC = "bg-[#45BE44]", // Green (VOLC)
    EVAPORITE = "bg-[#F8E627]", // Yellow (EVAP)
    NA = "bg-[#FFFFFF]", // White (NA)
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
