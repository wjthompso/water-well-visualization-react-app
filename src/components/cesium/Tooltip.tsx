import React, { useContext } from "react";
import { TooltipContext } from "../../context/AppContext";

interface TooltipProps {}

const Tooltip: React.FC<TooltipProps> = () => {
    const { tooltipX, tooltipY, tooltipString } = useContext(TooltipContext);

    return (
        <>
            {tooltipString && (
                <div
                    id="tooltip"
                    style={{
                        position: "absolute",
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "5px",
                        padding: "10px",
                        boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
                        zIndex: 999,
                        display: "block",
                        left: `calc(${tooltipX}px - 12%)`,
                        top: `calc(${tooltipY}px - 19%)`,
                    }}
                >
                    {tooltipString}
                </div>
            )}
        </>
    );
};

export default Tooltip;
