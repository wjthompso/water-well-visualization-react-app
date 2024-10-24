import { WellData } from "../cesium/types";

const hexToRgba = (hex: string, alpha: number): string => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface WellLithologyTableProps {
    selectedWellData: WellData | null;
    metersOrFeet: "meters" | "feet";
}

const convertToMeters = (feet: number): number => feet * 0.3048;

export default function WellLithologyTable(props: WellLithologyTableProps) {
    const { selectedWellData, metersOrFeet } = props;

    return (
        <div
            id="well-lithology-table"
            className="flex flex-col max-w-[25rem]"
        >
            {selectedWellData?.layers.map((layer, index) => {
                const startDepth =
                    metersOrFeet === "meters"
                        ? convertToMeters(layer.unAdjustedStartDepth)
                        : layer.unAdjustedStartDepth;
                const endDepth =
                    metersOrFeet === "meters"
                        ? convertToMeters(layer.unAdjustedEndDepth)
                        : layer.unAdjustedEndDepth;

                return (
                    <div
                        key={index}
                        className="flex"
                    >
                        <div
                            id="thin-vertical-color-bar-for-lithology-layer"
                            className={`w-2 bg-${layer.color}`}
                            style={{
                                backgroundColor: hexToRgba(layer.color, 1),
                            }}
                        ></div>
                        <div
                            className={`flex flex-col justify-between flex-1 p-2`}
                            style={{
                                backgroundColor: hexToRgba(layer.color, 0.5),
                            }}
                        >
                            <div className="flex justify-between">
                                <div className="flex-1 pr-[1rem]">
                                    <p className="font-semibold">
                                        {layer.type.join(", ")}
                                    </p>
                                    <p>{layer.description || "N/A"}</p>
                                </div>
                                <p className="w-[5.5rem] flex flex-row justify-start">
                                    {`${Math.round(startDepth)}-${Math.round(
                                        endDepth
                                    )} ${
                                        metersOrFeet === "meters" ? "m" : "ft"
                                    }`}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            }) || <p className="text-center">No data available</p>}
        </div>
    );
}
