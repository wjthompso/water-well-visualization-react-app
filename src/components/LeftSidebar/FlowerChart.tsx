import React, { useEffect, useRef, useState } from "react";

interface DataItem {
    id: string;
    value: number;
    color: string;
    name: string;
    bgColorTWClass: string;
}

let data: DataItem[] = [
    {
        id: "water",
        value: 0.91,
        color: "#A7344E",
        name: "Domain 1",
        bgColorTWClass: "bg-[#A7344E]",
    },
    {
        id: "social",
        value: 0.72,
        color: "#B94E31",
        name: "Domain 2",
        bgColorTWClass: "bg-[#B94E31]",
    },
    {
        id: "air",
        value: 0.9,
        color: "#E16727",
        name: "Domain 3",
        bgColorTWClass: "bg-[#E16727]",
    },
    {
        id: "economy",
        value: 0.64,
        color: "#D78935",
        name: "Domain 4",
        bgColorTWClass: "bg-[#D78935]",
    },
    {
        id: "ecosystems",
        value: 0.8,
        color: "#D5A227",
        name: "Domain 5",
        bgColorTWClass: "bg-[#D5A227]",
    },
    {
        id: "culture",
        value: 0.05,
        color: "#DAC32F",
        name: "Domain 6",
        bgColorTWClass: "bg-[#DAC32F]",
    },
    {
        id: "biodiversity",
        value: 0.72,
        color: "#A9B646",
        name: "Domain 7",
        bgColorTWClass: "bg-[#A9B646]",
    },
    {
        id: "carbon",
        value: 0.84,
        color: "#2FBD89",
        name: "Domain 8",
        bgColorTWClass: "bg-[#2FBD89]",
    },
    {
        id: "infrastructure",
        value: 1.0,
        color: "#4EA09F",
        name: "Domain 9",
        bgColorTWClass: "bg-[#4EA09F]",
    },
];

interface FlowerChartProps {
    domainScores: {
        overall_resilience: number;
        air: number;
        water: number;
        ecosystems: number;
        biodiversity: number;
        infrastructure: number;
        social: number;
        economy: number;
        culture: number;
        carbon: number;
    };
}

const FlowerChart: React.FC<FlowerChartProps> = ({ domainScores }) => {
    const chartRef = useRef<SVGGElement | null>(null);
    const legendRef = useRef<HTMLDivElement | null>(null);
    const [centerText, setCenterText] = useState("--");
    const [textColor, setTextColor] = useState("currentColor");
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

    const domainKeys = Object.keys(
        domainScores
    ) as (keyof typeof domainScores)[];

    if (domainKeys.length > 0) {
        const updatedData = data.map((item) => {
            const score = domainScores[item.id as keyof typeof domainScores];
            return { ...item, value: score };
        });
        data = updatedData;
    }

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        const totalArcs = data.length;
        const arcAngle = (2 * Math.PI) / totalArcs;
        const offsetAngle = Math.PI / 2; // Adjust this value to set the starting angle of the "Water" slice

        data.forEach((d, i) => {
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
                setCenterText((d.value * 100).toFixed(0));
                setTextColor(d.color);
                setHoveredSlice(d.name);
            });

            path.addEventListener("mouseout", () => {
                chart
                    .querySelectorAll("path.aster__solid-arc")
                    .forEach((p, index) => {
                        p.setAttribute("fill", data[index].color);
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
            // Delete all of the path objects so that we can re-render them
            chart.querySelectorAll("path.aster__solid-arc").forEach((path) => {
                path.remove();
            });
        };
    }, [domainScores]);

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
                        transform="translate(165,170)"
                        ref={chartRef}
                    >
                        <text
                            className="text-3xl font-bold text-leftSidebarRightBorder"
                            dy=".35em"
                            textAnchor="middle"
                            fill={textColor}
                        >
                            {centerText}
                        </text>
                    </g>
                </svg>
            </div>
            <div className="mt-4 mb-2 ml-1">
                <h1 className="pb-2 text-sm font-bold font-BeVietnamPro text-leftSidebarOverallResilience">
                    Legend
                </h1>
                <div
                    className="flex max-w-[194px] flex-wrap items-center justify-between"
                    ref={legendRef}
                >
                    {data.map((domain, index) => (
                        <div
                            key={index}
                            className={`mb-1 inline-flex min-w-[50%] items-center ${
                                hoveredSlice && hoveredSlice !== domain.name
                                    ? "text-gray-400 opacity-50"
                                    : "text-white opacity-100"
                            }`}
                        >
                            <div
                                className={`mr-1 h-[14px] w-[14px] rounded-sm transition-colors duration-100 ease-out ${
                                    hoveredSlice && hoveredSlice !== domain.name
                                        ? "bg-gray-400"
                                        : domain.bgColorTWClass
                                }`}
                            ></div>
                            <p className="text-xs font-BeVietnamPro">
                                {domain.name}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FlowerChart;
