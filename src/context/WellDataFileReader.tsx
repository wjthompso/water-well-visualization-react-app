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
    return rawData.map((data) => {
        const lithologies = [data.Lithology1].filter(
            (lith) => ["n/a", "N/A", "NA"].includes(lith) === false
        );

        const lithologiesSplit: string[] = splitStringsIntoLists(lithologies);

        // Split the words in the lithology column value by commas and the word " and "
        // console.log(lithologiesSplit);

        const depthInterval =
            (data.BottomDepth_InUnitsOfFeet - data.TopDepth_InUnitsOfFeet) /
            lithologies.length;

        const layers: Layer[] = lithologiesSplit.map((lithology, index) => ({
            type: GroundMaterialType[
                lithology as keyof typeof GroundMaterialType
            ],
            color: GroundMaterialTypeColor[
                lithology as keyof typeof GroundMaterialTypeColor
            ],
            startDepth:
                data.TopDepth_InUnitsOfFeet + index * depthInterval + index * 1,
            endDepth:
                data.TopDepth_InUnitsOfFeet +
                (index + 1) * depthInterval +
                index * 1,
        }));

        // Check if any of the type or color is undefined
        if (layers.some((layer) => layer.type === undefined)) {
            console.error(
                `Error: The following lithology type is not defined: ${lithologiesSplit}`
            );
        }

        return {
            longitude: data.Lon,
            latitude: data.Lat,
            startDepth: data.TopDepth_InUnitsOfFeet,
            endDepth: data.BottomDepth_InUnitsOfFeet,
            layers: layers,
            metadata: `${data.Lithology1}, ${data.StateWellID}`,
        };
    });
}

export const wellDataFromRawData = convertRawDataToWellData(rawDangermondData);
// console.log(wellDataFromRawData);
// console.log();
