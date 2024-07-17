import { rawDangermondData } from "./DangermondData"; // Assume this is in rawDangermondData.ts
import {
    GroundMaterialType,
    GroundMaterialTypeColor,
    Layer,
    WellData,
} from "./WellData"; // Assume these are in WellDataTypes.ts

function toTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function splitStringsIntoLists(strings: string[]): string[] {
    if (
        strings.length === 1 &&
        (strings[0] === "n/a" ||
            strings[0] === "na" ||
            strings[0] === "N/A" ||
            strings[0] === "NA")
    ) {
        return ["NA"];
    }

    return strings
        .map((str) => {
            const regex = /,\s+|\s+and\s+/;
            return str.split(regex).map((s) => toTitleCase(s.trim()));
        })
        .flat();
}

function convertRawDataToWellData(
    rawData: typeof rawDangermondData
): WellData[] {
    // Step 1: Group data by WellID
    const groupedData = rawData.reduce((acc, data) => {
        if (!acc[data.WellID]) {
            acc[data.WellID] = [];
        }
        acc[data.WellID].push(data);
        return acc;
    }, {} as { [key: string]: typeof rawDangermondData });

    // Step 2: Transform grouped data into WellData objects
    return Object.values(groupedData).map((wellGroup) => {
        const firstEntry = wellGroup[0]; // Assuming all entries in the group have the same Lat, Lon, and WellID
        const layers: Layer[] = [];

        wellGroup.forEach((data) => {
            const lithologies = [data.Lithology1].map((lith) =>
                ["n/a", "N/A", "NA"].includes(lith) ? "NA" : lith
            );

            const lithologiesSplit: string[] =
                splitStringsIntoLists(lithologies);

            const groundTypes = lithologiesSplit
                .map(
                    (lithology) =>
                        GroundMaterialType[
                            lithology as keyof typeof GroundMaterialType
                        ]
                )
                .filter((type) => type !== undefined);

            if (groundTypes.length > 0) {
                const layer: Layer = {
                    type: groundTypes,
                    color: GroundMaterialTypeColor[
                        lithologiesSplit[0] as keyof typeof GroundMaterialTypeColor
                    ],
                    startDepth: data.TopDepth_InUnitsOfFeet,
                    endDepth: data.BottomDepth_InUnitsOfFeet,
                };

                layers.push(layer);
            }
        });

        // Log an error if any of the lithology types are undefined
        layers.forEach((layer) => {
            if (layer.type.length === 0) {
                console.error(
                    `Error: The following lithology type is not defined: ${layer.type}`
                );
            }
        });

        return {
            longitude: firstEntry.Lon,
            latitude: firstEntry.Lat,
            startDepth: Math.min(...layers.map((layer) => layer.startDepth)),
            endDepth: Math.max(...layers.map((layer) => layer.endDepth)),
            layers: layers,
            metadata: `${firstEntry.Lithology1}, ${firstEntry.StateWellID}`,
            WellID: firstEntry.WellID,
            StateWellID: firstEntry.StateWellID,
        };
    });
}

export const wellDataFromRawData = convertRawDataToWellData(rawDangermondData);
