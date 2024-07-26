import React, { useContext } from "react";
import { TooltipContext } from "../../context/AppContext"; // adjust the import path as needed

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
                {selectedWellData ? (
                    <>
                        <div
                            id="well-info"
                            className="mb-4"
                        >
                            <h1 className="lg:text-xl font-[900] mb-1 font-roboto">
                                {selectedWellData.StateWellID || "Unknown Well"}
                            </h1>
                            <h3 className="text-base font-roboto">
                                {formatCoordinate(
                                    selectedWellData.latitude,
                                    true
                                )}
                                <br />
                                {formatCoordinate(
                                    selectedWellData.longitude,
                                    false
                                )}
                            </h3>
                        </div>
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
                                            {Math.floor(
                                                layer.unAdjustedStartDepth
                                            )}
                                            -
                                            {Math.floor(
                                                layer.unAdjustedEndDepth
                                            )}{" "}
                                            ft
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-white">
                        Please click on a well to see the lithology breakdown
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSideBar;
