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

    return (
        <>
            {tooltipString && (
                <div
                    id="tooltip"
                    ref={tooltipRef}
                    style={{
                        position: "absolute",
                        backgroundColor: "white",
                        color: "black",
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
            )}
        </>
    );
};

export default Tooltip;
