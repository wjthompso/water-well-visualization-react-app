import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useEffect, useRef, useState } from "react";
import PDFIcon from "../../assets/PDFIcon.svg";

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

    // Initial Y position based on parent or window height
    const [initialY, setInitialY] = useState(
        parentRef.current
            ? parentRef.current.offsetHeight - peekHeight
            : window.innerHeight - peekHeight
    );

    const [{ y }, api] = useSpring(() => ({
        y: initialY,
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
            }
        }
    }, [componentRef, parentRef]);

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
                const topBound =
                    parentHeight - componentHeight - componentLeftMargin;
                const bottomBound = parentHeight - peekHeight;
                const newY = Math.min(Math.max(oy, topBound), bottomBound);
                api.start({ y: newY });
            }
            return memo;
        },
        {
            axis: "y",
            from: () => [heightOfSearchBarRef.current, y.get()],
        }
    );

    return (
        <animated.div
            {...bind()}
            ref={componentRef}
            style={{
                y,
                touchAction: "none",
            }}
            className="absolute mx-2 top-0 left-0 z-50 visible w-[calc(100%-1rem)] p-4 bg-white border rounded-xl cursor-move shadow-topShadow md:hidden"
        >
            <div
                id="scrollable-content"
                className="w-full h-full overflow-y-scroll"
            >
                <div className="px-4">
                    <div
                        id="bar-to-indicate-draggability"
                        className="w-20 px-4 py-1 mx-auto bg-gray-300 rounded"
                    ></div>
                    <h2 className="mt-2 mb-4 text-2xl font-bold text-center">
                        Oak Wells #1
                    </h2>
                    <div className="grid grid-cols-[2.2fr_3fr_2fr] mb-4">
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold">Well ID:</p>
                            <p className="text-sm font-semibold">Latitude:</p>
                            <p className="text-sm font-semibold">Longitude:</p>
                            <p className="text-sm font-semibold">
                                Drill reason:
                            </p>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm">oak_wells_#1</p>
                            <p className="text-sm">34°25'51.5"N</p>
                            <p className="text-sm">119°52'42.6"W</p>
                            <p className="text-sm">Searching for petroleum</p>
                        </div>
                        <div className="flex items-center justify-center ml-1">
                            <button className="flex items-center justify-start w-28 h-12 py-2 border-[1px] border-black rounded">
                                <img
                                    className="flex w-[1.75rem] mx-2 sm:mx-2 justify-self-start"
                                    src={PDFIcon}
                                    alt="PDF Report Icon"
                                />
                                <p className="flex justify-start text-[0.75rem] w-12 font-bold text-black text-left">
                                    {" "}
                                    DRILL REPORT
                                </p>{" "}
                            </button>
                        </div>
                    </div>
                    <div
                        id="divider-bar"
                        className="absolute left-0 w-[calc(100%)] h-2 bg-[#EDEDED] border-[1px] border-y-[#D2D2D2]"
                    ></div>
                    <div className="mt-8">
                        <h3 className="flex justify-center mt-2 mb-2 text-2xl font-bold">
                            Well lithology
                        </h3>
                    </div>
                    <div
                        id="well-lithology-table"
                        className="flex flex-col"
                    >
                        <div className="flex rounded-none">
                            <div className="w-2 bg-yellow-400"></div>
                            <div className="flex flex-col justify-between flex-1 p-2 bg-yellow-200">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">
                                            Clastic Sedimentary,
                                        </p>
                                        <p>Course-grained</p>
                                    </div>
                                    <p className="w-[20%] flex flex-row justify-start">
                                        0-20 ft
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-2 bg-orange-400"></div>
                            <div className="flex flex-col justify-between flex-1 p-2 bg-orange-200">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">
                                            Unconsolidated,
                                        </p>
                                        <p>Course- and fine-grained</p>
                                    </div>
                                    <p className="w-[20%] flex flex-row justify-start">
                                        20-60 ft
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-2 bg-green-400"></div>
                            <div className="flex flex-col justify-between flex-1 p-2 bg-green-200">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">
                                            Other, Volcanic Class
                                        </p>
                                    </div>
                                    <p className="w-[20%] flex flex-row justify-start">
                                        60-88 ft
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-2 bg-red-400"></div>
                            <div className="flex flex-col justify-between flex-1 p-2 bg-red-200">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">
                                            Sedimentary,
                                        </p>
                                        <p>Course- and Fine-grained</p>
                                    </div>
                                    <p className="w-[20%] flex flex-row justify-start">
                                        88.3-91.25 ft
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-2 bg-red-600"></div>
                            <div className="flex flex-col justify-between flex-1 p-2 bg-red-400">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">
                                            Clastic sedimentary,
                                        </p>
                                        <p>Mostly fine-grained</p>
                                    </div>
                                    <p className="w-[20%] flex flex-row justify-start">
                                        91.25-135 ft
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div id="extra-info-text">
                    <p>
                        1. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Eligendi, sit? Quisquam quia in enim a. Possimus
                        cum sequi iusto labore excepturi. Ratione illo corrupti
                        saepe reprehenderit atque cumque praesentium sapiente.
                    </p>
                    <p>
                        2. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Distinctio iusto officia, commodi incidunt ipsam
                        rem et reprehenderit eius excepturi deserunt quae velit
                        labore consectetur exercitationem perspiciatis delectus
                        doloribus rerum possimus?
                    </p>
                    <p>
                        3. Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Labore quasi fugiat ipsa reprehenderit quia hic
                        quo, soluta repellendus doloribus placeat voluptas.
                        Asperiores sapiente consequatur alias debitis enim
                        impedit, eos ipsum?
                    </p>
                    <p>
                        4. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Facilis, dolorem voluptatibus nesciunt accusantium
                        ab consequatur nulla est corrupti minus ratione ea at
                        incidunt error molestias cumque, enim iste accusamus
                        officiis.
                    </p>
                    <p>
                        5. Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Labore quasi fugiat ipsa reprehenderit quia hic
                        quo, soluta repellendus doloribus placeat voluptas.
                        Asperiores sapiente consequatur alias debitis enim
                        impedit, eos ipsum?
                    </p>
                    <p>
                        6. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Facilis, dolorem voluptatibus nesciunt accusantium
                        ab consequatur nulla est corrupti minus ratione ea at
                        incidunt error molestias cumque, enim iste accusamus
                        officiis.
                    </p>
                    <p>
                        7. Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Labore quasi fugiat ipsa reprehenderit quia hic
                        quo, soluta repellendus doloribus placeat voluptas.
                        Asperiores sapiente consequatur alias debitis enim
                        impedit, eos ipsum?
                    </p>
                    <p>
                        8. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Facilis, dolorem voluptatibus nesciunt accusantium
                        ab consequatur nulla est corrupti minus ratione ea at
                        incidunt error molestias cumque, enim iste accusamus
                        officiis.
                    </p>
                    <p>
                        9. Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Labore quasi fugiat ipsa reprehenderit quia hic
                        quo, soluta repellendus doloribus placeat voluptas.
                        Asperiores sapiente consequatur alias debitis enim
                        impedit, eos ipsum?
                    </p>
                    <p>
                        10. Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Facilis, dolorem voluptatibus nesciunt accusantium
                        ab consequatur nulla est corrupti minus ratione ea at
                        incidunt error molestias cumque, enim iste accusamus
                        officiis.
                    </p>
                </div> */}
            </div>
        </animated.div>
    );
};

export default DraggableComponent;