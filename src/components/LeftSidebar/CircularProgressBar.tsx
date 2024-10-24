import React, { useContext, useEffect, useState } from "react";
import { TooltipContext } from "../../context/AppContext";
import { formatGroundMaterialType } from "../../utilities/formatGroundMaterialType";
import { GroundMaterialType, GroundMaterialTypeColor } from "../cesium/types";

interface CircularProgressBarProps {}

const CircularProgressBar: React.FC<CircularProgressBarProps> = () => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const { selectedWellData } = useContext(TooltipContext);
    const [lithologyPercentage, setLithologyPercentage] = useState(0);
    const [color, setColor] = useState("#D3D3D3");
    const [lithologyString, setLithologyString] = useState("");

    // Function to calculate the most frequent lithology
    const calculateLithologyPercentage = () => {
        if (!selectedWellData || !selectedWellData.layers)
            return { percentage: 0, color: "#D3D3D3" };

        const layers = selectedWellData.layers;
        const lithologyMap: { [key: string]: number } = {};

        layers.forEach((layer: any) => {
            const { type, unAdjustedStartDepth, unAdjustedEndDepth } = layer;
            const depth = Math.abs(unAdjustedEndDepth - unAdjustedStartDepth);
            if (!lithologyMap[type]) {
                lithologyMap[type] = 0;
            }
            lithologyMap[type] += depth;
        });

        const totalDepth = Object.values(lithologyMap).reduce(
            (acc, depth) => acc + depth,
            0
        );

        if (totalDepth === 0) {
            // Avoid division by zero
            setLithologyString("");
            return { percentage: 0, color: "#D3D3D3" };
        }

        // Determine the most frequent lithology
        const mostFrequentLithology = Object.keys(lithologyMap).reduce((a, b) =>
            lithologyMap[a] > lithologyMap[b] ? a : b
        );

        // Update the state with the most frequent lithology
        setLithologyString(mostFrequentLithology);

        const lithologyPercentage =
            (lithologyMap[mostFrequentLithology] / totalDepth) * 100;

        // Find the corresponding key in GroundMaterialType
        const materialTypeKey = Object.keys(GroundMaterialType).find(
            (key) =>
                GroundMaterialType[key as keyof typeof GroundMaterialType] ===
                mostFrequentLithology
        );

        // Get the color from GroundMaterialTypeColor
        const strokeColor = materialTypeKey
            ? GroundMaterialTypeColor[
                  materialTypeKey as keyof typeof GroundMaterialTypeColor
              ]
            : "#D3D3D3";

        return { percentage: lithologyPercentage, color: strokeColor };
    };

    useEffect(() => {
        const { percentage, color } = calculateLithologyPercentage();
        // Update the state for percentage and color
        setLithologyPercentage(percentage);
        setColor(color);
    }, [selectedWellData]); // Trigger effect when selectedWellData changes

    const dashOffset =
        circumference - (circumference * lithologyPercentage) / 100;

    return (
        <>
            <div className="relative w-[212px] h-40 mb-4">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                        className="text-gray-300"
                        strokeWidth="25"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50%"
                        cy="50%"
                    />
                    <circle
                        style={{
                            stroke: color,
                            transition: "stroke-dashoffset 0.5s ease-out",
                        }}
                        strokeWidth="25"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50%"
                        cy="50%"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-semibold">
                        {Math.round(lithologyPercentage)}%
                    </span>
                </div>
            </div>
            {lithologyString && (
                <h3
                    className=""
                    id="dominant-lithology-type"
                >
                    {formatGroundMaterialType(lithologyString)}
                </h3>
            )}
        </>
    );
};

export default CircularProgressBar;
