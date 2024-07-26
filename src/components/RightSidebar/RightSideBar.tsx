import React, { useContext } from "react";
import { TooltipContext } from "../../context/AppContext"; // adjust the import path as needed

const RightSideBar: React.FC = () => {
    const { selectedWellData } = useContext(TooltipContext);

    return (
        <div
            id="rightSideBar"
            className="hidden md:block absolute right-0 top-0 w-[17rem] h-full z-[999] bg-sideBarBackgroundColor border-l-[0.5px] border-borderColor"
        >
            <h1
                id="main-label"
                className="flex items-center w-full h-[3rem] pl-[1.4rem] text-white text-2xl font-[600] font-lora border-b-[0.5px] border-borderColor"
            >
                Selected Well Info
            </h1>
            <div
                id="right-side-bar-content"
                className="flex flex-col items-start justify-start w-full h-[calc(100%-3rem)] px-[1.4rem] py-[1rem] text-white overflow-scroll"
            >
                <div
                    id="well-info"
                    className="mb-4"
                >
                    <h1 className="lg:text-xl font-[600] mb-1 font-roboto overflow-hidden whitespace-nowrap text-ellipsis">
                        {selectedWellData
                            ? selectedWellData.StateWellID || "Unknown Well"
                            : "--"}
                    </h1>
                    <h3 className="text-base font-roboto">
                        {selectedWellData
                            ? `${selectedWellData.latitude.toFixed(
                                  5
                              )}°, ${selectedWellData.longitude.toFixed(5)}°`
                            : "--"}
                    </h3>
                </div>
                {/* <div
                    id="water-status"
                    className="mb-4"
                >
                    <h1 className="text-xl font-[600] mb-1 font-roboto">
                        Water Status
                    </h1>
                    <h3 className="flex flex-row text-base font-roboto">
                        <div className="mr-2">🚫</div>
                        {selectedWellData ? "No water detected" : "--"}
                    </h3>
                </div>
                <div
                    id="drilling-motive"
                    className="mb-4"
                >
                    <h1 className="text-xl font-[600] mb-1 font-roboto">
                        Original Drilling Motive
                    </h1>
                    <h3 className="text-base font-roboto">
                        {selectedWellData ? "Looking for petroleum" : "--"}
                    </h3>
                </div> */}
                {/* <div
                    id="drill-report"
                    className="mb-4"
                >
                    <button className="flex flex-row justify-center px-4 py-2 w-[14rem] text-black bg-drillReportButtonBackgroundColor rounded-md font-roboto text-[1rem] font-bold">
                        <img
                            src={PDFReport}
                            alt="PDF Logo"
                            className="mr-2"
                        />{" "}
                        DRILL REPORT
                    </button>
                </div> */}
                {selectedWellData && (
                    <div
                        id="lithology-breakdown"
                        className="text-black"
                    >
                        <h1 className="text-xl font-[600] mb-2 font-roboto text-white">
                            Lithology breakdown
                        </h1>
                        {selectedWellData.layers.map((layer, index) => (
                            <div
                                key={index}
                                className={`grid grid-cols-3 gap-2 p-2 text-sm`}
                                style={{ backgroundColor: layer.color }}
                            >
                                <p className="col-span-2">
                                    <b>{layer.type.join(", ")}</b>
                                    {layer.description
                                        ? `, ${layer.description}`
                                        : ""}
                                </p>
                                <p>
                                    {Math.floor(layer.unAdjustedStartDepth)}-
                                    {Math.floor(layer.unAdjustedEndDepth)} ft
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSideBar;
