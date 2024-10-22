import React from "react";

interface CircularProgressBarProps {
    percentage: number;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
    percentage,
}) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * percentage) / 100;

    let colorClass = "text-red-500"; // Default color for <25%

    if (percentage == 0) {
        colorClass = "text-gray-300";
    } else if (percentage >= 75) {
        colorClass = "text-[#32AC03]";
    } else if (percentage >= 25) {
        colorClass = "text-[#FAE107]";
    } else if (percentage < 25) {
        colorClass = "text-[#F00101]";
    }

    return (
        <div className="relative w-40 h-40 mb-4">
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
                    className={`duration-1 transition-colors ${colorClass}`}
                    strokeWidth="25"
                    strokeLinecap="butt"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: dashOffset,
                        transition: "stroke-dashoffset 1s ease-in-out",
                    }}
                />
            </svg>
            <div
                className={`flex h-full w-full items-center justify-center text-2xl font-semibold transition-colors duration-500 ${colorClass}`}
            >
                {percentage !== 0 ? `${percentage.toFixed(0)}%` : "--"}
            </div>
        </div>
    );
};

export default CircularProgressBar;
