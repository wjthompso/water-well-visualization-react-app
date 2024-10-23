import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import CopyIcon from "../../assets/CopyIcon.svg"; // Assume you have a CopyIcon SVG
import DownArrow from "../../assets/DownArrow.svg"; // Assume you have a DownArrow SVG
import UpArrow from "../../assets/UpArrow.svg";
import { TooltipContext } from "../../context/AppContext"; // adjust the import path as needed
import CircularProgressBar from "../LeftSidebar/CircularProgressBar";
import FlowerChart from "../LeftSidebar/FlowerChart";
import MetersOrFeetToggleButton from "../ToggleButtons/MetersOrFeetToggleButton";
import WellLithologyTable from "../WellLithologyTable/WellLithologyTable";

interface DraggableComponentProps {
    parentRef: React.RefObject<HTMLDivElement>;
    searchBarRef: React.RefObject<HTMLDivElement>;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({
    parentRef,
    searchBarRef,
}) => {
    const peekHeight = 150; // Height of the part of the component that peeks above the bottom of the screen
    const componentRef = useRef<HTMLDivElement>(null);
    const heightOfSearchBarRef = useRef(45);
    const componentLeftMarginRef = useRef(8);
    const { selectedWellData } = useContext(TooltipContext);
    const [metersOrFeet, setMetersOrFeet] = useState<"meters" | "feet">("feet");

    const [isExpanded, setIsExpanded] = useState(false); // Track if the bottom sheet is expanded
    const [showComponent, setShowComponent] = useState(false); // Replace ref with state

    // Initial Y position based on parent or window height
    const [initialY, setInitialY] = useState(
        parentRef.current
            ? parentRef.current.offsetHeight - peekHeight
            : window.innerHeight - peekHeight
    );

    const [{ y }, api] = useSpring(() => ({
        y: initialY,
        config: { tension: 300, friction: 30 },
    }));

    // Update the search bar height once available
    useEffect(() => {
        if (searchBarRef.current) {
            heightOfSearchBarRef.current = searchBarRef.current.offsetHeight;
        }
    }, [searchBarRef]);

    // Update the showComponent state based on window width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 769) {
                setShowComponent(false);
                setShowComponent(true);
            } else {
                setShowComponent(true);
                setShowComponent(false);
            }
        };

        window.addEventListener("resize", handleResize);

        // Call the handleResize function to set the initial state
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Update the left margin of the component once available
    useEffect(() => {
        if (componentRef.current) {
            componentLeftMarginRef.current = parseInt(
                getComputedStyle(componentRef.current).marginLeft
            );
        }
    }, [componentRef]);

    // Set the height property of the component after filling in the content to enable scrolling
    useEffect(() => {
        if (componentRef.current && parentRef.current) {
            componentRef.current.style.height = "";
            const parentHeight = parentRef.current.offsetHeight;
            const componentHeight = componentRef.current.offsetHeight;
            const componentLeftMargin = componentLeftMarginRef.current;
            if (componentHeight > parentHeight) {
                const parentHeightMinusMargin =
                    parentHeight -
                    heightOfSearchBarRef.current -
                    componentLeftMargin * 2;
                componentRef.current.style.height = `${parentHeightMinusMargin}px`;
            }
        }
    }, [componentRef, parentRef, selectedWellData, showComponent]); // Now depends on showComponent state

    // Update the initial Y value once the parentRef is available
    useEffect(() => {
        if (parentRef.current) {
            const newInitialY = parentRef.current.offsetHeight - peekHeight;
            setInitialY(newInitialY);
            api.set({ y: newInitialY });
        }
    }, [parentRef, api, peekHeight]);

    // Custom hook to handle drag behavior
    const bind = useDrag(
        ({ offset: [, oy], memo = y.get() }) => {
            if (componentRef.current && parentRef.current) {
                const componentHeight = componentRef.current.offsetHeight;
                const parentHeight = parentRef.current.offsetHeight;
                const componentLeftMargin = componentLeftMarginRef.current;
                const topBoundA =
                    parentHeight - componentHeight - componentLeftMargin;
                const topBoundB =
                    heightOfSearchBarRef.current + componentLeftMargin;
                const topBound = Math.max(topBoundA, topBoundB);
                const bottomBound = parentHeight - peekHeight;
                const newY = Math.min(Math.max(oy, topBound), bottomBound);
                api.start({ y: newY, immediate: true });
                if (newY === bottomBound) {
                    setIsExpanded(false);
                } else if (newY === topBound) {
                    setIsExpanded(true);
                }
            }
            return memo;
        },
        {
            axis: "y",
            from: () => [heightOfSearchBarRef.current, y.get()],
        }
    );

    const handleButtonClick = () => {
        if (componentRef.current && parentRef.current) {
            const componentHeight = componentRef.current.offsetHeight;
            const parentHeight = parentRef.current.offsetHeight;
            const componentLeftMargin = componentLeftMarginRef.current;
            const topBoundA =
                parentHeight - componentHeight - componentLeftMargin;
            const topBoundB =
                heightOfSearchBarRef.current + componentLeftMargin;
            const topBound = Math.max(topBoundA, topBoundB);
            const bottomBound = parentHeight - peekHeight;
            const currentY = y.get();

            // Toggle between topBound and bottomBound
            const newY = currentY === bottomBound ? topBound : bottomBound;
            setIsExpanded(currentY === bottomBound); // Update the state based on the new position
            api.start({ y: newY });
        }
    };

    if (!selectedWellData) return <></>;

    return (
        <animated.div
            {...bind()}
            ref={componentRef}
            style={{
                y,
                touchAction: "none",
            }}
            className="absolute mx-2 top-0 left-0 z-50 visible w-[calc(100%-1rem)] bg-headerBackgroundColor text-white border-[1px] border-borderColor rounded-xl cursor-move shadow-topShadow md:hidden flex flex-col"
        >
            <button
                id="slide-footer-up-or-down"
                className="flex justify-center items-center absolute w-7 h-7 rounded-full left-2 top-2 bg-[#6A6A6A] drop-shadow-md"
                onClick={handleButtonClick}
            >
                <img
                    src={isExpanded ? DownArrow : UpArrow}
                    alt="toggle-arrow"
                />
            </button>
            <div className="px-8">
                <div
                    id="bar-to-indicate-draggability"
                    className="w-20 px-4 py-1 mx-auto mt-4 bg-gray-300 rounded"
                ></div>
                {/* Well ID */}
                <h2 className="mt-2 mb-4 text-2xl font-bold text-center break-all whitespace-normal select-none">
                    {selectedWellData?.StateWellID || "N/A"}
                </h2>
                <div
                    id="selected-well-info"
                    className="flex flex-col mb-4"
                >
                    <div className="grid self-center items-center w-[15rem] grid-cols-[2fr_2fr_1fr] gap-1 mb-2">
                        {/* Latitude Label */}
                        <div className="flex flex-col col-span-1">
                            <p className="text-sm font-semibold">Latitude:</p>
                        </div>

                        {/* Latitude Value */}
                        <div className="flex flex-col col-span-1">
                            <p className="text-sm whitespace-normal">
                                {selectedWellData
                                    ? `${selectedWellData.latitude}°`
                                    : "N/A"}
                            </p>
                        </div>

                        {/* Copy Icon for Latitude */}
                        <div className="flex items-center justify-center row-span-2">
                            <button
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-[#6A6A6A] active:bg-[#8C8C8C] transition-colors"
                                onClick={() => {
                                    if (selectedWellData) {
                                        navigator.clipboard.writeText(
                                            `${selectedWellData.latitude},${selectedWellData.longitude}`
                                        );
                                    }
                                }}
                            >
                                <img
                                    src={CopyIcon}
                                    alt="Copy Latitude"
                                />
                            </button>
                        </div>

                        {/* Longitude Label */}
                        <div className="flex flex-col col-span-1">
                            <p className="text-sm font-semibold">Longitude:</p>
                        </div>

                        {/* Longitude Value */}
                        <div className="flex flex-col col-span-1">
                            <p className="text-sm whitespace-normal">
                                {selectedWellData
                                    ? `${selectedWellData.longitude}°`
                                    : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div
                id="divider-bar"
                className="w-[calc(100%)] h-[1px] bg-borderColor"
            ></div>
            <div className="flex-grow px-4 py-4 overflow-y-auto">
                <h3 className="flex justify-center mb-2 text-2xl font-bold">
                    Well lithology
                </h3>
                <div className="flex items-center justify-center w-full mb-2">
                    <MetersOrFeetToggleButton
                        metersOrFeet={metersOrFeet}
                        setMetersOrFeet={setMetersOrFeet}
                    ></MetersOrFeetToggleButton>
                </div>
                <WellLithologyTable
                    metersOrFeet={metersOrFeet}
                    selectedWellData={selectedWellData}
                ></WellLithologyTable>
                <div
                    id="divider-bar"
                    className="w-[calc(100%+2rem)] mt-4 h-[1px] bg-borderColor -mx-4"
                ></div>
                <div
                    id="circular-progress-bar-container"
                    className="flex flex-col items-center py-2"
                >
                    <h1 className="text-xl font-bold">Dominant Lithology</h1>
                    <CircularProgressBar />
                </div>
                <div
                    id="divider-bar"
                    className="w-[calc(100%+2rem)] mt-4 h-[1px] bg-borderColor -mx-4"
                ></div>
                <div
                    id="lithology-breakdown-container"
                    className="flex flex-col items-center py-2"
                >
                    <h1 className="mt-4 text-xl font-bold">
                        Lithology Breakdown
                    </h1>
                    <FlowerChart />
                </div>
            </div>
        </animated.div>
    );
};

export default DraggableComponent;
