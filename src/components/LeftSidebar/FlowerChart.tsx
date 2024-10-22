import React, { useEffect, useRef, useState } from "react";
import { TooltipContext } from "../../context/AppContext"; // Adjust the import path as needed
import { useContextSelector } from "./customHooks/useContextSelector";

// Assuming GroundMaterialType and GroundMaterialTypeColor are enums or objects
import { GroundMaterialType, GroundMaterialTypeColor } from "../cesium/types";

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

        const { startDepth, endDepth, layers } = selectedWellData;
        const totalDepth = endDepth - startDepth;

        // Ensure total depth is greater than 0
        if (totalDepth <= 0) return;

        // Group layers by GroundMaterialType
        const depthByType: { [key in GroundMaterialType]?: number } = {};

        layers.forEach((layer) => {
            layer.type.forEach((type) => {
                const depth = layer.endDepth - layer.startDepth;
                depthByType[type] = (depthByType[type] || 0) + Math.abs(depth);
            });
        });

        // Calculate percentage and prepare petal data
        const newPetalData: PetalData[] = Object.entries(depthByType).map(
            ([type, depth]) => ({
                id: type,
                name: GroundMaterialType[
                    type as keyof typeof GroundMaterialType
                ],
                value: depth! / totalDepth,
                color: GroundMaterialTypeColor[
                    type as keyof typeof GroundMaterialTypeColor
                ],
            })
        );

        setPetalData(newPetalData);
    }, [selectedWellData]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        // Clear previous petals
        while (chart.firstChild) {
            chart.removeChild(chart.firstChild);
        }

        if (petalData.length === 0) return;

        const totalArcs = petalData.length;
        const arcAngle = (2 * Math.PI) / totalArcs;
        const offsetAngle = Math.PI / 2; // Starting angle

        petalData.forEach((d, i) => {
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

            const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

            const pathData = [
                `M ${x0} ${y0}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x1} ${y1}`,
                `L ${x2} ${y2}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x3} ${y3}`,
                `Z`,
            ].join(" ");

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            path.setAttribute("d", pathData);
            path.setAttribute("fill", d.color);
            path.setAttribute(
                "class",
                "aster__solid-arc transition-colors duration-100 ease-out"
            );

            // Add event listeners for hover effect
            path.addEventListener("mouseover", () => {
                chart.querySelectorAll("path.aster__solid-arc").forEach((p) => {
                    if (p !== path) {
                        p.setAttribute("fill", "#d3d3d3");
                    }
                });
                setCenterText(`${(d.value * 100).toFixed(0)}%`);
                setTextColor(d.color);
                setHoveredSlice(d.name);
            });

            path.addEventListener("mouseout", () => {
                chart
                    .querySelectorAll("path.aster__solid-arc")
                    .forEach((p, index) => {
                        p.setAttribute("fill", petalData[index].color);
                    });
                setCenterText("--");
                setTextColor("currentColor");
                setHoveredSlice(null);
            });

            chart.appendChild(path);

            // Add outline arc
            const outlineRadius = innerRadius + 125;
            const outlinePathData = [
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

            const outlinePath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            outlinePath.setAttribute("d", outlinePathData);
            outlinePath.setAttribute("fill", "none");
            outlinePath.setAttribute("stroke", "#ededf1");
            outlinePath.setAttribute("stroke-width", "1");
            chart.appendChild(outlinePath);
        });

        return () => {
            // Cleanup on unmount or data change
            while (chart.firstChild) {
                chart.removeChild(chart.firstChild);
            }
        };
    }, [petalData]);

    return (
        <div>
            <div className="h-[11rem] w-full">
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
                            className="text-3xl font-bold text-center"
                            dy=".35em"
                            textAnchor="middle"
                            fill={textColor}
                        >
                            {centerText}
                        </text>
                    </g>
                </svg>
            </div>
            {petalData.length > 0 && (
                <div className="mt-4 mb-2 ml-1">
                    <h1 className="pb-2 text-sm font-bold font-BeVietnamPro text-leftSidebarOverallResilience">
                        Legend
                    </h1>
                    <div
                        className="flex flex-col max-w-[194px] items-start space-y-1"
                        ref={legendRef}
                    >
                        {petalData.map((domain, index) => (
                            <div
                                key={index}
                                className={`flex items-center ${
                                    hoveredSlice && hoveredSlice !== domain.name
                                        ? "text-gray-400 opacity-50"
                                        : "text-white opacity-100"
                                }`}
                            >
                                <div
                                    className={`mr-2 h-[14px] w-[14px] rounded-sm transition-colors duration-100 ease-out`}
                                    style={{
                                        backgroundColor:
                                            hoveredSlice &&
                                            hoveredSlice !== domain.name
                                                ? "#d3d3d3"
                                                : domain.color,
                                    }}
                                ></div>
                                <p className="text-xs font-BeVietnamPro">
                                    {domain.name} (
                                    {(domain.value * 100).toFixed(1)}%)
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
