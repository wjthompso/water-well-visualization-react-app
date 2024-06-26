export enum GroundMaterialType {
    Adobe = "Adobe",
    Basalt = "Basalt",
    Clay = "Clay",
    Conglomerate = "Conglomerate",
    Dolomite = "Dolomite",
    Granite = "Granite",
    Gravel = "Gravel",
    Gypsum = "Gypsum",
    Limestone = "Limestone",
    NA = "NA",
    Quartzite = "Quartzite",
    Rock = "Rock",
    Sand = "Sand",
    Sandstone = "Sandstone",
    Shale = "Shale",
    Siltstone = "Siltstone",
    Soil = "Soil",
}

export enum GroundMaterialTypeColor {
    Adobe = "#FFD800",
    Basalt = "#000000",
    Clay = "#FFA07A",
    Conglomerate = "#8B0000",
    Dolomite = "#FF4500",
    Granite = "#808080",
    Gravel = "#D3D3D3",
    Gypsum = "#FF0000",
    Limestone = "#00FF00",
    NA = "#FFFFFF",
    Rock = "#A9A9B11",
    Quartzite = "#800000",
    Sand = "#C2B280",
    Sandstone = "#FFD700",
    Shale = "#A9A9A9",
    Siltstone = "#FF6347",
    Soil = "#FFFF00",
}

export interface Layer {
    type: GroundMaterialType;
    color: GroundMaterialTypeColor;
    startDepth: number;
    endDepth: number;
}

export interface WellData {
    longitude: number;
    latitude: number;
    startDepth: number;
    endDepth: number;
    layers: Layer[];
    metadata?: string | null;
}

export const dangermondPosition = {
    longitude: -120.452283,
    latitude: 34.464167,
};

export const wellData: WellData[] = [
    {
        longitude: -120.452283 - 0.016,
        latitude: 34.464167 - 0.016,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the fourth well.",
    },
    {
        longitude: -120.452283,
        latitude: 34.464167,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the first well.",
    },
    {
        longitude: -120.452283 + 0.01,
        latitude: 34.464167,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the second well.",
    },
    {
        longitude: -120.452283,
        latitude: 34.464167 + 0.01,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the third well",
    },
    {
        longitude: -120.452283 + 0.01,
        latitude: 34.464167 + 0.01,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the fourth well.",
    },
    {
        longitude: -120.452283 + 0.015,
        latitude: 34.464167 + 0.015,
        startDepth: 0,
        endDepth: 100,
        layers: [
            {
                type: GroundMaterialType.Sandstone,
                color: GroundMaterialTypeColor.Sandstone,
                startDepth: 0,
                endDepth: 20,
            },
            {
                type: GroundMaterialType.Limestone,
                color: GroundMaterialTypeColor.Limestone,
                startDepth: 20,
                endDepth: 40,
            },
            {
                type: GroundMaterialType.Shale,
                color: GroundMaterialTypeColor.Shale,
                startDepth: 40,
                endDepth: 60,
            },
            {
                type: GroundMaterialType.Granite,
                color: GroundMaterialTypeColor.Granite,
                startDepth: 60,
                endDepth: 80,
            },
            {
                type: GroundMaterialType.Basalt,
                color: GroundMaterialTypeColor.Basalt,
                startDepth: 80,
                endDepth: 100,
            },
        ],
        metadata: "This is the fourth well.",
    },
];
