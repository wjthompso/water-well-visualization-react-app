import React, { useState } from "react";
import CircularProgressBar from "./CircularProgressBar";
import FlowerChart from "./FlowerChart";

const Sidebar: React.FC = () => {
    // State to track the sidebar visibility
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const percentage = 50;

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={`absolute z-30 top-0 hidden md:block left-0 h-full bg-headerBackgroundColor text-white overflow-hidden transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } w-64 border-r-[1px] border-borderColor`}
            >
                <div className="relative hidden px-4 py-3 md:block">
                    {/* X button to close the sidebar */}
                    <button
                        onClick={toggleSidebar}
                        className="absolute p-1 text-white rounded-md top-2 right-2 focus:outline-none"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                    {/* Sidebar Content */}
                    <h1 className="mb-[10px] text-xl font-bold">
                        Dominant Lithology
                    </h1>
                    <CircularProgressBar />
                    {/* Lithology Breakdown Flower Chart */}
                    <hr className="relative left-0 right-0 px-4 -mx-4 my-4 border-t-[0.5px] border-[#808080]" />

                    <h1 className="mt-4 text-xl font-bold">
                        Lithology Breakdown
                    </h1>
                    <h3 className="text-[12px]">
                        <i>Hover over slice to see percentage</i>
                    </h3>
                    <FlowerChart />
                </div>
            </div>

            {/* Hamburger Button, visible only when sidebar is collapsed */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="absolute z-20 p-[calc(0.4rem-(1.8px/2))] text-white border-borderColor rounded-md border-[1px] bg-headerBackgroundColor top-[6.4px] left-2 focus:outline-none"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        ></path>
                    </svg>
                </button>
            )}
        </>
    );
};

export default Sidebar;
