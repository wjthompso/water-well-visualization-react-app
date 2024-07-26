import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useContext, useEffect, useRef, useState } from "react";
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
            const parentHeight = parentRef.current.offsetHeight;
            const componentHeight = componentRef.current.offsetHeight;
            const componentLeftMargin = componentLeftMarginRef.current;
            if (componentHeight > parentHeight) {
                const parentHeightMinusMargin =
                    parentHeight -
                    heightOfSearchBarRef.current -
                    componentLeftMargin * 2;
                componentRef.current.style.height = `${parentHeightMinusMargin}px`;
                console.log("parentHeightMinusMargin", parentHeightMinusMargin);
            }
        }
    }, [componentRef, parentRef, selectedWellData]);

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
                // console.log("topBound", topBound, "bottomBound", bottomBound);
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

    if (!selectedWellData) return <></>;

    return (
        <animated.div
            {...bind()}
            ref={componentRef}
            style={{
                y,
                touchAction: "none",
            }}
            className="absolute mx-2 top-0 left-0 z-50 visible w-[calc(100%-1rem)] bg-headerBackgroundColor text-white border-[1px] border-borderColor rounded-xl cursor-move shadow-topShadow md:hidden"
        >
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
                    <div className="grid grid-cols-[2.2fr_3fr_2fr] mb-4">
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold">Well ID:</p>
                            <p className="text-sm font-semibold">Latitude:</p>
                            <p className="text-sm font-semibold">Longitude:</p>
                        </div>
                        <div className="flex flex-col pl-2">
                            <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                {selectedWellData?.StateWellID || "N/A"}
                            </p>
                            <p className="text-sm">
                                {selectedWellData
                                    ? `${selectedWellData.latitude}°`
                                    : "N/A"}
                            </p>
                            <p className="text-sm">
                                {selectedWellData
                                    ? `${selectedWellData.longitude}°`
                                    : "N/A"}
                            </p>
                        </div>
                        <div className="flex items-center justify-center ml-1">
                            {/* <button className="flex items-center justify-start w-28 h-12 py-2 border-[1px] border-borderColor rounded">
                                <img
                                    className="flex w-[1.75rem] mx-2 sm:mx-2 justify-self-start"
                                    src={PDFIcon}
                                    alt="PDF Report Icon"
                                />
                                <p className="flex justify-start text-[0.75rem] w-12 font-bold text-white text-left">
                                    {" "}
                                    DRILL REPORT
                                </p>{" "}
                            </button> */}
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
