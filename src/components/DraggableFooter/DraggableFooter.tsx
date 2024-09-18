import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import DownArrow from "../../assets/DownArrow.svg"; // Assume you have a DownArrow SVG
import UpArrow from "../../assets/UpArrow.svg";
import { TooltipContext } from "../../context/AppContext"; // adjust the import path as needed

interface DraggableComponentProps {
    parentRef: React.RefObject<HTMLDivElement>;
    searchBarRef: React.RefObject<HTMLDivElement>;
}

const hexToRgba = (hex: string, alpha: number): string => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DraggableComponent: React.FC<DraggableComponentProps> = ({
    parentRef,
    searchBarRef,
}) => {
    const peekHeight = 150; // Height of the part of the component that peeks above the bottom of the screen
    const componentRef = useRef<HTMLDivElement>(null);
    const heightOfSearchBarRef = useRef(45);
    const componentLeftMarginRef = useRef(8);
    const { selectedWellData } = useContext(TooltipContext);

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
            className="absolute mx-2 top-0 left-0 z-50 visible w-[calc(100%-1rem)] bg-headerBackgroundColor text-white border-[1px] border-borderColor rounded-xl cursor-move shadow-topShadow md:hidden shadow-xl"
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
            <div
                id="scrollable-content"
                className="w-full h-full overflow-y-scroll"
            >
                <div className="px-8">
                    <div
                        id="bar-to-indicate-draggability"
                        className="w-20 px-4 py-1 mx-auto mt-4 bg-gray-300 rounded"
                    ></div>
                    <h2 className="mt-2 mb-4 text-2xl font-bold text-center select-none">
                        Selected Well Info
                    </h2>
                    <div
                        id="selected-well-info"
                        className="flex flex-col mb-4"
                    >
                        {/* Well ID */}
                        <div className="flex w-full mb-1">
                            <div className="flex flex-col w-1/4">
                                <p className="text-sm font-semibold">
                                    Well ID:
                                </p>
                            </div>
                            <div className="flex flex-col w-3/4 pl-2">
                                <p className="text-sm whitespace-normal">
                                    {selectedWellData?.StateWellID || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Latitude */}
                        <div className="flex w-full mb-1">
                            <div className="flex flex-col w-1/4">
                                <p className="text-sm font-semibold">
                                    Latitude:
                                </p>
                            </div>
                            <div className="flex flex-col w-3/4 pl-2">
                                <p className="text-sm whitespace-normal">
                                    {selectedWellData
                                        ? `${selectedWellData.latitude}°`
                                        : "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Longitude */}
                        <div className="flex w-full">
                            <div className="flex flex-col w-1/4">
                                <p className="text-sm font-semibold">
                                    Longitude:
                                </p>
                            </div>
                            <div className="flex flex-col w-3/4 pl-2">
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
                <div className="px-4 py-4">
                    <h3 className="flex justify-center mb-2 text-2xl font-bold">
                        Well lithology
                    </h3>
                    <div
                        id="well-lithology-table"
                        className="flex flex-col"
                    >
                        {selectedWellData?.layers.map((layer, index) => (
                            <div
                                key={index}
                                className="flex"
                            >
                                <div
                                    className={`w-2 bg-${layer.color}`}
                                    style={{
                                        backgroundColor: hexToRgba(
                                            layer.color,
                                            1
                                        ),
                                    }}
                                ></div>
                                <div
                                    className={`flex flex-col justify-between flex-1 p-2`}
                                    style={{
                                        backgroundColor: hexToRgba(
                                            layer.color,
                                            0.5
                                        ),
                                    }}
                                >
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {layer.type.join(", ")}
                                            </p>
                                            <p>{layer.description || "N/A"}</p>
                                        </div>
                                        <p className="w-[20%] flex flex-row justify-start">
                                            {`${Math.round(
                                                layer.unAdjustedStartDepth
                                            )}-${Math.round(
                                                layer.unAdjustedEndDepth
                                            )} ft`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )) || <p className="text-center">No data available</p>}
                    </div>
                </div>
            </div>
        </animated.div>
    );
};

export default DraggableComponent;
