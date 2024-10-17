// types.ts

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

export interface Chunk {
    topLeft: {
        lat: number;
        lon: number;
    };
    bottomRight: {
        lat: number;
        lon: number;
    };
}

export interface RawLayer {
    0: number; // startDepth
    1: number; // endDepth
    2: string; // description
    3: string; // type
    4: number; // value1
    5: number; // value2
    6: number; // value3
    7: number; // value4
}

export interface RawWellData {
    lat: number;
    lon: number;
    total_well_depth_in_ft: number;
    well_id: string;
    layers: RawLayer[];
}

export interface SubChunkLocation {
    topLeft: {
        lat: number;
        lon: number;
    };
    bottomRight: {
        lat: number;
        lon: number;
    };
}

export interface SubChunk {
    location: SubChunkLocation;
    wells: WellData[]; // Ensure this is WellData[]
}

export interface SubChunkedWellData {
    sub_chunks: SubChunk[];
}
