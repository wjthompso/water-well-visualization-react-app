import React, { useState } from "react";
import LegendArrowsDown from "../../assets/LegendArrowsDown.svg";
import LegendArrowsUp from "../../assets/LegendArrowsUp.svg";

const Legend: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div
            className={`hidden md:block md:absolute bottom-0 left-0 transition-transform duration-200 ${
                isVisible ? "translate-y-0" : "translate-y-full"
            }`}
        >
            <div className="w-[34.44rem] h-[8.19rem] px-3 py-[0.4rem] bg-legendBackgroundColor text-white rounded-tr-lg border-[0.5px] border-[#808080] relative">
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
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-yellow-300"></span>
                                Coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-yellow-500"></span>
                                Mostly coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-orange-400"></span>
                                Coarse- and fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-orange-600"></span>
                                Mostly fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-red-500"></span>
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
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-yellow-300"></span>
                                Coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-yellow-500"></span>
                                Mostly coarse-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-orange-400"></span>
                                Coarse- and fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-orange-600"></span>
                                Mostly fine-grained
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-red-500"></span>
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
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-pink-400"></span>
                                Till
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-gray-300"></span>
                                Carbonate (e.g., limestone)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-green-600"></span>
                                Volcanic (e.g., basalt)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-purple-700"></span>
                                Evaporite (e.g., gypsum)
                            </p>
                            <p className="flex items-center text-[0.7rem]">
                                <span className="inline-block w-4 h-4 mr-[0.4rem] bg-blue-800"></span>
                                Endogenous (e.g., granite)
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    id="legend-toggle-button"
                    onClick={toggleVisibility}
                    className={
                        `absolute w-24 h-6 flex flex-row justify-center items-center text-white border-[0.5px] bg-legendBackgroundColor border-legendBorderColor left-4 ` +
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
            </div>
        </div>
    );
};

export default Legend;
