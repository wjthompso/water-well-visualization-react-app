import React, { useContext, useState } from "react";
import { TooltipContext } from "../../context/AppContext"; // adjust the import path as needed
import CopyCoordinatesButton from "../Buttons/CopyCoordinatesButton";
import DownloadCSVButton from "../Buttons/DownloadDrillingDataCSVButton";
import DownloadDrillReportPDFButton from "../Buttons/DownloadDrillReportPDFButton";
import FinePrint from "../FinePrint/FinePrint";
import MetersOrFeetToggleButton from "../ToggleButtons/MetersOrFeetToggleButton";
import WellLithologyTable from "../WellLithologyTable/WellLithologyTable";

const formatCoordinate = (value: number, isLatitude: boolean) => {
    const absoluteValue = Math.abs(value);
    const degrees = Math.floor(absoluteValue);
    const minutes = Math.floor((absoluteValue - degrees) * 60);
    const seconds = ((absoluteValue - degrees - minutes / 60) * 3600).toFixed(
        2
    );
    const direction =
        value >= 0 ? (isLatitude ? " N" : " E") : isLatitude ? " S" : " W";
    return `${degrees}°${minutes}'${seconds}"${direction}`;
};

const RightSideBar: React.FC = () => {
    const { selectedWellData } = useContext(TooltipContext);
    const [metersOrFeet, setMetersOrFeet] = useState<"meters" | "feet">("feet");

    console.log("Well PDF Link", selectedWellData?.drillNotesPDF);

    return (
        <div
            id="rightSideBar"
            className="hidden md:block absolute right-0 top-0 max-w-[19rem] h-full z-[999] bg-sideBarBackgroundColor border-l-[0.5px] border-borderColor"
        >
            <div
                id="right-side-bar-content"
                className="flex flex-col items-start justify-start w-full h-[100%] px-[1rem] py-[0.75rem] text-white overflow-scroll"
            >
                {selectedWellData ? (
                    <>
                        <div
                            id="well-info"
                            className="max-w-full mb-[0.75rem]"
                        >
                            <h1 className="lg:text-xl font-[900] mb-1 font-roboto break-words text-ellipsis max-w-full">
                                {selectedWellData.StateWellID || "Unknown Well"}
                            </h1>

                            {/* Two-column grid for formatted latitude and longitude with Copy button */}
                            <div className="grid grid-cols-[2fr_1fr] items-center ml-[0.8rem]">
                                {/* Latitude and Longitude */}
                                <div>
                                    <h3 className="text-base font-roboto">
                                        <b>Long</b>&nbsp;&nbsp;
                                        {formatCoordinate(
                                            selectedWellData.latitude,
                                            true
                                        )}
                                        <br />
                                        <b>Lat</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                        {formatCoordinate(
                                            selectedWellData.longitude,
                                            false
                                        )}
                                    </h3>
                                </div>
                                {/* Copy button */}
                                <div className="flex justify-end ml-1 mr-2">
                                    <CopyCoordinatesButton
                                        latitude={selectedWellData.latitude}
                                        longitude={selectedWellData.longitude}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lithology Breakdown Section */}
                        {selectedWellData && (
                            <div
                                id="lithology-breakdown"
                                className="text-white"
                            >
                                <div
                                    id="divider-line"
                                    className="relative left-[-1.4rem] w-[calc(100%+2.8rem)] h-[0.5px] bg-borderColor mb-[0.75rem]"
                                ></div>

                                <div className="flex flex-row gap-2 ml-2">
                                    <DownloadCSVButton
                                        selectedWellData={selectedWellData}
                                    />
                                    {selectedWellData.drillNotesPDF ? (
                                        <DownloadDrillReportPDFButton
                                            drillNotesPDF={
                                                selectedWellData.drillNotesPDF
                                            }
                                        />
                                    ) : null}
                                </div>

                                <div
                                    id="divider-line"
                                    className="relative left-[-1.4rem] w-[calc(100%+2.8rem)] h-[0.5px] mt-[0.75rem] bg-borderColor"
                                ></div>

                                <h1 className="text-xl font-[600] mb-[10px] mt-[0.75rem] font-roboto text-white">
                                    Lithology breakdown
                                </h1>

                                <div
                                    id="meters-or-feet-toggle-button-container"
                                    className="mb-[10px] ml-4"
                                >
                                    <MetersOrFeetToggleButton
                                        metersOrFeet={metersOrFeet}
                                        setMetersOrFeet={setMetersOrFeet}
                                    />
                                </div>

                                <WellLithologyTable
                                    metersOrFeet={metersOrFeet}
                                    selectedWellData={selectedWellData}
                                />

                                <div
                                    id="divider-line"
                                    className="relative left-[-1.4rem] w-[calc(100%+2.8rem)] h-[0.5px] mt-[0.75rem] mb-[0.75rem] bg-borderColor"
                                ></div>

                                <FinePrint />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="text-center text-white">
                            Please click on a well to see the lithology
                            breakdown
                        </div>
                        <div
                            id="divider-line"
                            className="relative left-[-1.4rem] w-[calc(100%+2.8rem)] h-[0.5px] mt-[0.75rem] bg-borderColor"
                        ></div>
                        <div className="flex-grow"></div>
                        {/* Fills remaining space */}
                        <div
                            id="divider-line"
                            className="relative left-[-1.4rem] w-[calc(100%+2.8rem)] h-[0.5px] mb-[0.75rem] bg-borderColor"
                        ></div>
                        <FinePrint />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSideBar;
