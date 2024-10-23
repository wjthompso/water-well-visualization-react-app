import React from "react";

interface MetersOrFeetToggleButtonProps {
    metersOrFeet: "meters" | "feet";
    setMetersOrFeet: (value: "meters" | "feet") => void;
}

const MetersOrFeetToggleButton: React.FC<MetersOrFeetToggleButtonProps> = ({
    metersOrFeet,
    setMetersOrFeet,
}) => {
    return (
        <div
            className="flex w-[128px] ml-[20px] h-[20px] text-black border border-[#A9A9A9] bg-[#A9A9A9] rounded-[3px] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]"
            id="meters-or-feet-toggle-button"
        >
            <button
                className={`flex-1 flex items-center justify-center ${
                    metersOrFeet === "feet"
                        ? "bg-white"
                        : "bg-[#A9A9A9] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]"
                } rounded-l-[2.2px] h-[18px] transition-colors duration-300 ease-in-out font-bold text-[12px]`}
                onClick={() => setMetersOrFeet("feet")}
            >
                Feet
            </button>
            <button
                className={`flex-1 flex items-center justify-center ${
                    metersOrFeet === "meters"
                        ? "bg-white"
                        : "bg-[#A9A9A9] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]"
                } rounded-r-[2.2px] h-[18px] transition-colors duration-300 ease-in-out font-bold text-[12px]`}
                onClick={() => setMetersOrFeet("meters")}
            >
                Meters
            </button>
        </div>
    );
};

export default MetersOrFeetToggleButton;
