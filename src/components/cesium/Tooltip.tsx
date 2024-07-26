import React, { useContext, useEffect, useRef, useState } from "react";
import { TooltipContext } from "../../context/AppContext";

interface TooltipProps {}

const Tooltip: React.FC<TooltipProps> = () => {
    const { tooltipX, tooltipY, tooltipString } = useContext(TooltipContext);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipWidth, setTooltipWidth] = useState(0);

    useEffect(() => {
        if (tooltipRef.current) {
            setTooltipWidth(tooltipRef.current.offsetWidth);
        }
    }, [tooltipString]);

    // Check if tooltipString is a string or an object
    const isStringTooltip = (str: string | object): str is string => {
        return typeof str === "string";
    };

    return (
        <>
            {tooltipString &&
                (isStringTooltip(tooltipString) ? (
                    tooltipString.trim() !== "" && (
                        <div
                            id="tooltip"
                            ref={tooltipRef}
                            className="text-white bg-headerBackgroundColor"
                            style={{
                                position: "absolute",
                                borderRadius: "5px",
                                padding: "10px",
                                boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
                                zIndex: 999,
                                display: "block",
                                left: `${tooltipX - tooltipWidth / 2}px`,
                                top: `${tooltipY - 150}px`, // Adjust this value as needed to position the tooltip above the cursor
                                whiteSpace: "nowrap", // Prevents text from wrapping, adjust or remove as needed
                            }}
                        >
                            {tooltipString}
                        </div>
                    )
                ) : (
                    <div
                        id="tooltip"
                        ref={tooltipRef}
                        className="text-white bg-headerBackgroundColor"
                        style={{
                            position: "absolute",
                            borderRadius: "5px",
                            padding: "10px",
                            boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
                            zIndex: 999,
                            display: "block",
                            left: `${tooltipX - tooltipWidth / 2}px`,
                            top: `${tooltipY - 200}px`, // Adjust this value as needed to position the tooltip above the cursor
                            whiteSpace: "nowrap", // Prevents text from wrapping, adjust or remove as needed
                        }}
                    >
                        <div className="text-base">
                            {tooltipString.startDepth}-{tooltipString.endDepth}{" "}
                            ft
                        </div>
                        <div className="text-sm">
                            <strong>Category:</strong>{" "}
                            {tooltipString.type.join(", ")}
                        </div>
                        <div className="text-sm">
                            <strong>Driller Notes:</strong>{" "}
                            {tooltipString.lithologyDescription}
                        </div>
                    </div>
                ))}
        </>
    );
};

export default Tooltip;
