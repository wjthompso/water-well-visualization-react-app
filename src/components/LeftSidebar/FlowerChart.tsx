// src/components/cesium/FlowerChart.tsx

import React, { useEffect, useRef, useState } from "react";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as needed
import { formatGroundMaterialType } from "../../utilities/formatGroundMaterialType";
import { GroundMaterialType } from "../cesium/types";
import { useContextSelector } from "./customHooks/useContextSelector";

interface PetalData {
    id: string;
    value: number; // Percentage (0 to 1)
    color: string;
    name: string;
}

const FlowerChart: React.FC = () => {
    const chartRef = useRef<SVGGElement | null>(null);
    const legendRef = useRef<HTMLDivElement | null>(null);
    const [centerText, setCenterText] = useState("--");
    const [textColor, setTextColor] = useState("currentColor");
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const selectedWellData = useContextSelector(
        TooltipContext,
        (ctx) => ctx.selectedWellData
    );

    const [petalData, setPetalData] = useState<PetalData[]>([]);

    useEffect(() => {
        if (!selectedWellData) {
            setPetalData([]);
            return;
        }

        const { layers } = selectedWellData;
        const totalDepth =
            selectedWellData.layers[selectedWellData.layers.length - 1]
                .unAdjustedEndDepth -
            selectedWellData.layers[0].unAdjustedStartDepth;

        // Ensure total depth is greater than 0
        if (totalDepth <= 0) return;

        // Group layers by GroundMaterialType and accumulate depth and color
        const depthByType: {
            [key in GroundMaterialType]?: { depth: number; color: string };
        } = {};

        // Group the layers by GroundMaterialType and accumulate depth
        layers.forEach((layer) => {
            const layerDepth = Math.abs(
                layer.unAdjustedEndDepth - layer.unAdjustedStartDepth
            );

            layer.type.forEach((type) => {
                if (depthByType[type]) {
                    // If the type already exists, add the depth
                    depthByType[type]!.depth += layerDepth;
                } else {
                    // Otherwise, initialize with the layer's depth and color
                    depthByType[type] = {
                        depth: layerDepth,
                        color: layer.color, // Use the layer's color directly
                    };
                }
            });
        });

        // Convert the depthByType object into an array of PetalData
        const reverseGroundMaterialTypeMap = Object.entries(
            GroundMaterialType
        ).reduce((acc, [key, value]) => {
            acc[value] = key; // Map the string value to the enum key
            return acc;
        }, {} as { [key: string]: string });

        // Now, inside your map function:
        const newPetalData: PetalData[] = Object.entries(depthByType)
            .map(([type, data]) => {
                const enumKey = reverseGroundMaterialTypeMap[type];
                if (!enumKey) {
                    console.warn(
                        `No matching enum key found for type: ${type}`
                    );
                    return null;
                }
                return {
                    id: enumKey,
                    name: GroundMaterialType[
                        enumKey as keyof typeof GroundMaterialType
                    ],
                    value: data!.depth / totalDepth,
                    color: data!.color,
                };
            })
            .filter((petal) => petal !== null)
            .sort((a, b) => b!.value - a!.value) as PetalData[];

        setPetalData(newPetalData);
    }, [selectedWellData]);

    return (
        <div>
            <div className="w-full">
                <svg
                    className="flex flex-row justify-start flex-shrink aster__plot"
                    preserveAspectRatio="xMidYMid"
                    viewBox="0 0 400 400"
                >
                    <g
                        id="chart"
                        transform="translate(200,200)" // Center the chart
                        ref={chartRef}
                    >
                        <text
                            className="text-2xl font-bold text-center"
                            dy=".35em"
                            textAnchor="middle"
                            fill={textColor} // Use dynamic text color
                        >
                            {centerText}
                        </text>
                        {petalData.map((d: PetalData, i) => {
                            const isSingleFullPetal =
                                petalData.length === 1 && d.value === 1;

                            let pathData: string;
                            let outlinePathData: string | null = null;
                            let overlayPathData: string;

                            if (isSingleFullPetal) {
                                // Define radii
                                const innerRadius = 40;
                                const outerRadius = innerRadius + 125;

                                // Path for full donut using two arcs for outer and inner circles
                                pathData = [
                                    `M ${outerRadius},0`,
                                    `A ${outerRadius} ${outerRadius} 0 1,0 -${outerRadius} 0`,
                                    `A ${outerRadius} ${outerRadius} 0 1,0 ${outerRadius} 0`,
                                    `Z`,
                                    `M ${innerRadius},0`,
                                    `A ${innerRadius} ${innerRadius} 0 1,1 -${innerRadius} 0`,
                                    `A ${innerRadius} ${innerRadius} 0 1,1 ${innerRadius} 0`,
                                    `Z`,
                                ].join(" ");

                                // For overlay, use the same path
                                overlayPathData = pathData;

                                // No outline for single full petal
                            } else {
                                // Existing multiple-petal path calculation
                                const totalArcs = petalData.length;
                                const arcAngle = (2 * Math.PI) / totalArcs;
                                const offsetAngle = Math.PI / 2; // Starting angle

                                const startAngle = i * arcAngle - offsetAngle;
                                const endAngle = startAngle + arcAngle;
                                const innerRadius = 40;
                                const outerRadius = innerRadius + d.value * 125;

                                const x0 = Math.cos(startAngle) * innerRadius;
                                const y0 = Math.sin(startAngle) * innerRadius;
                                const x1 = Math.cos(endAngle) * innerRadius;
                                const y1 = Math.sin(endAngle) * innerRadius;
                                const x2 = Math.cos(endAngle) * outerRadius;
                                const y2 = Math.sin(endAngle) * outerRadius;
                                const x3 = Math.cos(startAngle) * outerRadius;
                                const y3 = Math.sin(startAngle) * outerRadius;

                                const largeArcFlag =
                                    endAngle - startAngle <= Math.PI
                                        ? "0"
                                        : "1";

                                pathData = [
                                    `M ${x0} ${y0}`,
                                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x1} ${y1}`,
                                    `L ${x2} ${y2}`,
                                    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x3} ${y3}`,
                                    `Z`,
                                ].join(" ");

                                // Outline path data
                                const outlineRadius = innerRadius + 125;
                                outlinePathData = [
                                    `M ${Math.cos(startAngle) * innerRadius} ${
                                        Math.sin(startAngle) * innerRadius
                                    }`,
                                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${
                                        Math.cos(endAngle) * innerRadius
                                    } ${Math.sin(endAngle) * innerRadius}`,
                                    `L ${Math.cos(endAngle) * outlineRadius} ${
                                        Math.sin(endAngle) * outlineRadius
                                    }`,
                                    `A ${outlineRadius} ${outlineRadius} 0 ${largeArcFlag} 0 ${
                                        Math.cos(startAngle) * outlineRadius
                                    } ${Math.sin(startAngle) * outlineRadius}`,
                                    `Z`,
                                ].join(" ");

                                // Invisible overlay path data
                                const overlayRadius = innerRadius + 125; // Match the outer radius of the main circle
                                overlayPathData = [
                                    `M ${x0} ${y0}`,
                                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x1} ${y1}`,
                                    `L ${Math.cos(endAngle) * overlayRadius} ${
                                        Math.sin(endAngle) * overlayRadius
                                    }`,
                                    `A ${overlayRadius} ${overlayRadius} 0 ${largeArcFlag} 0 ${
                                        Math.cos(startAngle) * overlayRadius
                                    } ${Math.sin(startAngle) * overlayRadius}`,
                                    `Z`,
                                ].join(" ");
                            }

                            return (
                                <React.Fragment key={`petal-${d.id}`}>
                                    <path
                                        d={pathData}
                                        fill={
                                            hoveredSlice &&
                                            hoveredSlice !== d.name
                                                ? "#333333" // Dark gray for non-hovered slices
                                                : d.color
                                        }
                                        className="transition-colors duration-100 ease-out aster__solid-arc"
                                        fillRule={
                                            isSingleFullPetal
                                                ? "evenodd"
                                                : "nonzero"
                                        } // Use 'evenodd' for single-petal to create a donut
                                    />
                                    {!isSingleFullPetal && outlinePathData && (
                                        <path
                                            d={outlinePathData}
                                            fill="none"
                                            stroke="#ededf1"
                                            strokeWidth="1"
                                        />
                                    )}
                                    <path
                                        d={overlayPathData}
                                        fill="transparent"
                                        onMouseOver={() => {
                                            setHoveredSlice(d.name);
                                            console.log(
                                                "hovered d.name",
                                                d.name
                                            );
                                            setCenterText(
                                                `${(d.value * 100).toFixed(0)}%`
                                            );
                                            setTextColor(d.color);
                                        }}
                                        onMouseOut={() => {
                                            setHoveredSlice(null);
                                            setCenterText("--");
                                            setTextColor("currentColor");
                                        }}
                                        style={{ cursor: "pointer" }} // Optional: Change cursor on hover
                                    />
                                </React.Fragment>
                            );
                        })}
                    </g>
                </svg>
            </div>
            {petalData.length > 0 && (
                <div className="mb-4">
                    {/* <h1 className="pb-2 text-sm font-bold font-BeVietnamPro text-leftSidebarOverallResilience">
                        Legend
                    </h1> */}
                    <div
                        className="flex flex-col max-w-[194px] items-start space-y-1"
                        ref={legendRef}
                    >
                        {petalData.map((domain, index) => (
                            <div
                                key={index}
                                className={`flex items-start ${
                                    hoveredSlice && hoveredSlice !== domain.name
                                        ? "text-gray-700 opacity-50" // Dark gray text
                                        : "text-white opacity-100"
                                }`}
                            >
                                <div
                                    className={`mr-2 mt-[2px] min-h-[14px] min-w-[14px] rounded-sm transition-colors duration-100 ease-out`}
                                    style={{
                                        backgroundColor:
                                            hoveredSlice &&
                                            hoveredSlice !== domain.name
                                                ? "#333333" // Dark gray background
                                                : domain.color,
                                    }}
                                ></div>
                                <p className="text-xs font-BeVietnamPro">
                                    {formatGroundMaterialType(domain.name)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlowerChart;
