import React, { useState } from "react";
import LegendArrowsDown from "../../assets/LegendArrowsDown.svg";
import LegendArrowsUp from "../../assets/LegendArrowsUp.svg";
import { TailwindGroundMaterialTypeColor } from "../cesium/types";

const Legend: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div
            id="legend-container"
            className={`hidden md:block md:absolute bottom-0 right-[303px] transition-transform duration-200 ${
                isVisible ? "translate-y-0" : "translate-y-full"
            }`}
        >
            <div className="w-[34.66rem] h-[8.19rem] px-3 py-[0.4rem] bg-legendBackgroundColor text-white rounded-t-lg border-[0.5px] border-[#808080] relative">
                <button
                    id="legend-toggle-button"
                    onClick={toggleVisibility}
                    className={
                        `absolute w-24 h-6 flex flex-row justify-center items-center text-white border-[0.5px] bg-legendBackgroundColor border-legendBorderColor right-4 ` +
                        (isVisible
                            ? "-top-[calc(1.5rem-0.5px)] border-b-[0px] rounded-t-lg"
                            : "-top-[calc(2rem)] rounded-lg")
                    }
                >
                    <p className="ml-2 text-sm font-bold">Legend</p>
                    <img
                        src={isVisible ? LegendArrowsDown : LegendArrowsUp}
                        alt="Legend Arrows Down"
                        className="w-6 h-6 ml-[0.1rem]"
                    />
                </button>
                <div className="flex justify-between h-full">
                    <div
                        id="legend-column-title-and-rows-0"
                        className="flex flex-col flex-1 h-full mr-1"
                    >
                        <h2 className="mb-1 text-sm font-bold">
                            Unconsolidated
                        </h2>
                        <div className="flex flex-col justify-between flex-1">
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.UNC_COARSE}`}
                                ></span>
                                Coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.UNC_MOSTLY_COARSE}`}
                                ></span>
                                Mostly coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.UNC_MIX_COARSE_FINE}`}
                                ></span>
                                Coarse- and fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.UNC_MOSTLY_FINE}`}
                                ></span>
                                Mostly fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.UNC_FINE}`}
                                ></span>
                                Fine-grained
                            </p>
                        </div>
                    </div>
                    <div
                        id="legend-column-title-and-rows-1"
                        className="flex flex-col flex-1 h-full mr-1"
                    >
                        <h2 className="mb-1 text-sm font-bold">
                            Clastic sedimentary
                        </h2>
                        <div className="flex flex-col justify-between flex-1">
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CONS_COARSE}`}
                                ></span>
                                Coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CONS_MOSTLY_COARSE}`}
                                ></span>
                                Mostly coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CONS_MIX_COARSE_FINE}`}
                                ></span>
                                Coarse- and fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CONS_MOSTLY_FINE}`}
                                ></span>
                                Mostly fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CONS_FINE}`}
                                ></span>
                                Fine-grained
                            </p>
                        </div>
                    </div>
                    <div
                        id="legend-column-title-and-rows-2"
                        className="flex flex-col flex-1 h-full"
                    >
                        <h2 className="mb-1 text-sm font-bold">Other</h2>
                        <div className="flex flex-col justify-between flex-1">
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.TILL}`}
                                ></span>
                                Till
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.CARBONATE}`}
                                ></span>
                                Carbonate (e.g., limestone)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.VOLCANIC}`}
                                ></span>
                                Volcanic (e.g., basalt)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.EVAPORITE}`}
                                ></span>
                                Evaporite (e.g., gypsum)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span
                                    className={`inline-block w-4 h-4 mr-[0.4rem] ${TailwindGroundMaterialTypeColor.ENDOGENOUS}`}
                                ></span>
                                Endogenous (e.g., granite)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Legend;
