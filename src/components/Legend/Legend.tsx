import React from "react";

const Legend: React.FC = () => {
    return (
        <div className="absolute bottom-0 left-0 w-[34.44rem] h-[8.19rem] px-3 py-[0.4rem] bg-gray-800 bg-opacity-80 text-white rounded-tr-lg">
            <div className="flex justify-between h-full">
                <div
                    id="legend-column-title-and-rows-0"
                    className="flex flex-col flex-1 h-full mr-1"
                >
                    <h2 className="mb-1 text-sm font-bold">Unconsolidated</h2>
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
            <button className="absolute w-8 h-8 text-white bg-gray-700 rounded-full -top-4 left-4">
                +
            </button>
        </div>
    );
};

export default Legend;
