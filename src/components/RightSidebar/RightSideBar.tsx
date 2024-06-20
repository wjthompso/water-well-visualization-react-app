export function RightSideBar() {
    return (
        <div
            id="rightSideBar"
            className="absolute right-0 top-0 w-[17rem] h-full z-[999] bg-sideBarBackgroundColor"
        >
            <h1
                id="main-label"
                className="flex items-center w-full h-[3rem] pl-[1.4rem] text-white text-2xl font-[600] font-lora border-[0.5px] border-borderColor"
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
                    <h1 className="text-xl font-[600] mb-1 font-lora">
                        Oak Wells #1
                    </h1>
                    <h3 className="text-base font-lora">
                        34°25'51.5"N, 119°52'42.6"W
                    </h3>
                </div>
                <div
                    id="water-status"
                    className="mb-4"
                >
                    <h1 className="text-xl font-[600] mb-1 font-lora">
                        Water Status
                    </h1>
                    <h3 className="text-base font-lora">
                        <span
                            role="img"
                            aria-label="no water"
                        >
                            🚫
                        </span>{" "}
                        No water detected as of 11/20/2014
                    </h3>
                </div>
                <div
                    id="drilling-motive"
                    className="mb-4"
                >
                    <h1 className="text-xl font-[600] mb-1 font-lora">
                        Original Drilling Motive
                    </h1>
                    <h3 className="text-base font-lora">
                        Looking for petroleum.
                    </h3>
                </div>
                <div
                    id="drill-report"
                    className="mb-4"
                >
                    <button className="px-4 py-2 text-white bg-gray-600 font-lora">
                        PDF DRILL REPORT
                    </button>
                </div>
                <div id="lithology-breakdown">
                    <h1 className="text-xl font-[600] mb-2 font-lora">
                        Lithology breakdown
                    </h1>
                    <div className="p-2 bg-yellow-400">
                        Clastic Sedimentary, Course-grained
                        <br />
                        0-20 ft
                    </div>
                    <div className="p-2 bg-orange-400">
                        Unconsolidated, Course- and fine-grained
                        <br />
                        20-60 ft
                    </div>
                    <div className="p-2 bg-green-400">
                        Other, Volcanic Class
                        <br />
                        60-88 ft
                    </div>
                    <div className="p-2 bg-red-400">
                        Sedimentary, Course- and Fine-grained
                        <br />
                        88.3-91.25 ft
                    </div>
                    <div className="p-2 bg-red-600">
                        Clastic sedimentary, Mostly fine-grained
                        <br />
                        91.25-135 ft
                    </div>
                </div>
            </div>
        </div>
    );
}
