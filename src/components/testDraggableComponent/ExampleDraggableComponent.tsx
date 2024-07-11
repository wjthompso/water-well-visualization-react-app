import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useEffect, useRef, useState } from "react";

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
    const [initialY, setInitialY] = useState(
        parentRef.current
            ? parentRef.current.offsetHeight - peekHeight
            : window.innerHeight - peekHeight
    );

    const [{ y }, api] = useSpring(() => ({
        y: initialY,
    }));

    useEffect(() => {
        if (searchBarRef.current) {
            heightOfSearchBarRef.current = searchBarRef.current.offsetHeight;
        }
    }, [searchBarRef]);

    useEffect(() => {
        if (componentRef.current) {
            componentLeftMarginRef.current = parseInt(
                getComputedStyle(componentRef.current).marginLeft
            );
        }
    }, [componentRef]);

    // Set the height property of the component to its calculated height after filling in the content
    // in order to enable scrolling without having to define a fixed height prior.
    useEffect(() => {
        if (componentRef.current && parentRef.current) {
            const parentHeight = parentRef.current.offsetHeight;
            const componentHeight = componentRef.current.offsetHeight;
            // Get the component's left margin
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
            setInitialY(parentRef.current.offsetHeight - peekHeight);
            api.set({ y: parentRef.current.offsetHeight - peekHeight });
        }
    }, [parentRef, api, peekHeight]);

    // Update the bounds when the window is resized
    useEffect(() => {
        const handleResize = () => {
            api.set({
                y: parentRef.current
                    ? parentRef.current.offsetHeight - peekHeight
                    : window.innerHeight - peekHeight,
            });
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [api, peekHeight, parentRef]);

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
                className="w-full h-full overflow-scroll"
            >
                <div className="px-4">
                    <div
                        id="bar-to-indicate-draggability"
                        className="w-20 px-4 py-1 mx-auto bg-gray-300 rounded"
                    ></div>
                    <h2 className="mt-2 mb-4 text-2xl font-bold text-center">
                        Oak Wells #1
                    </h2>
                    <div className="grid grid-cols-[1fr_2fr_3fr] mb-4">
                        <div className="flex flex-col justify-between">
                            <p className="text-sm font-semibold">Well ID:</p>
                            <p className="text-sm font-semibold">Latitude:</p>
                            <p className="text-sm font-semibold">Longitude:</p>
                            <p className="text-sm font-semibold">
                                Drill reason:
                            </p>
                        </div>
                        <div className="flex flex-col justify-between">
                            <p className="text-sm">oak_wells_#1</p>
                            <p className="text-sm">34°25'51.5"N</p>
                            <p className="text-sm">119°52'42.6"W</p>
                            <p className="text-sm">Searching for petroleum</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <button className="flex items-center justify-center w-32 h-10 font-semibold text-white bg-gray-700 rounded">
                                DRILL REPORT
                            </button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="flex justify-center mt-2 mb-2 text-2xl font-bold">
                            Well lithology
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="p-2 bg-yellow-200 rounded">
                            <p className="font-semibold">
                                Clastic Sedimentary,
                            </p>
                            <p>Course-grained</p>
                            <p>0-20 ft</p>
                        </div>
                        <div className="p-2 bg-orange-200 rounded">
                            <p className="font-semibold">Unconsolidated,</p>
                            <p>Course- and fine-grained</p>
                            <p>20-60 ft</p>
                        </div>
                        <div className="p-2 bg-green-200 rounded">
                            <p className="font-semibold">
                                Other, Volcanic Class
                            </p>
                            <p>60-88 ft</p>
                        </div>
                        <div className="p-2 bg-red-200 rounded">
                            <p className="font-semibold">Sedimentary,</p>
                            <p>Course- and Fine-grained</p>
                            <p>88.3-91.25 ft</p>
                        </div>
                        <div className="p-2 bg-red-400 rounded">
                            <p className="font-semibold">
                                Clastic sedimentary,
                            </p>
                            <p>Mostly fine-grained</p>
                            <p>91.25-135 ft</p>
                        </div>
                    </div>
                </div>

                <div id="extra-info-text">
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
                        10. Lorem ipsum dolor sit amet consectetur adipisicing
                        elit. Facilis, dolorem voluptatibus nesciunt accusantium
                        ab consequatur nulla est corrupti minus ratione ea at
                        incidunt error molestias cumque, enim iste accusamus
                        officiis.
                    </p>
                </div>
            </div>
        </animated.div>
    );
};

export default DraggableComponent;
