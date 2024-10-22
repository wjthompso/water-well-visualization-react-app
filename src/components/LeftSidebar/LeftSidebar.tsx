import React, { useState } from "react";
import CircularProgressBar from "./CircularProgressBar";
import FlowerChart from "./FlowerChart";

const Sidebar: React.FC = () => {
    // State to track the sidebar visibility
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const percentage = 50;

    // Example data for the flower chart (adjust this structure as needed)
    const lithologyScores = {
        overall_resilience: 0.9, // Example score for overall resilience
        air: 0.72,
        water: 0.91,
        ecosystems: 0.8,
        biodiversity: 0.72,
        infrastructure: 1.0,
        social: 0.64,
        economy: 0.9,
        culture: 0.05,
        carbon: 0.84,
    };

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={`absolute z-30 top-0 left-0 h-full bg-headerBackgroundColor text-white overflow-hidden transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } w-64`}
            >
                <div className="relative p-4">
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
                    <h1 className="text-xl font-bold">Sidebar Content</h1>
                    <p className="mt-4">Your sidebar content goes here.</p>
                    <CircularProgressBar percentage={percentage} />

                    {/* Lithology Breakdown Flower Chart */}
                    <h1 className="mt-6 mb-4 text-xl font-bold">
                        Lithology Breakdown
                    </h1>
                    <FlowerChart domainScores={lithologyScores} />
                </div>
            </div>

            {/* Hamburger Button, visible only when sidebar is collapsed */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="absolute z-20 p-2 text-white border-borderColor rounded-md border-[1px] bg-headerBackgroundColor top-4 left-4 focus:outline-none"
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
