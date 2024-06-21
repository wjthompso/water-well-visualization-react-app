import PDFReport from "../../assets/PDFReport.svg";

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
                    <h1 className="text-xl font-[600] mb-1 font-roboto">
                        Oak Wells #1
                    </h1>
                    <h3 className="text-base font-roboto">
                        34°25'51.5"N, 119°52'42.6"W
                    </h3>
                </div>
                <div
                    id="water-status"
                    className="mb-4"
                >
                    <h1 className="text-xl font-[600] mb-1 font-roboto">
                        Water Status
                    </h1>
                    <h3 className="flex flex-row text-base font-roboto">
                        <div className="mr-2">🚫</div> No water detected as of
                        11/20/2014
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
                        Looking for petroleum.
                    </h3>
                </div>
                <div
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
                </div>
                <div
                    id="lithology-breakdown"
                    className="text-black"
                >
                    <h1 className="text-xl font-[600] mb-2 font-roboto text-white">
                        Lithology breakdown
                    </h1>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm bg-yellow-400">
                        <p className="col-span-2">
                            <b>Clastic Sedimentary</b>, Course-grained
                        </p>
                        <p>0-20 ft</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm bg-orange-400">
                        <p className="col-span-2">
                            <b>Unconsolidated</b>, Course- and fine-grained
                        </p>
                        <p>20-60 ft</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm bg-green-400">
                        <p className="col-span-2">
                            <b>Other</b>, Volcanic Class
                        </p>
                        <p>60-88 ft</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm bg-red-400">
                        <p className="col-span-2">
                            <b>Sedimentary</b>, Course- and Fine-grained
                        </p>
                        <p>88.3-91.25 ft</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm bg-red-600">
                        <p className="col-span-2">
                            <b>Clastic sedimentary</b>, Mostly fine-grained
                        </p>
                        <p>91.25-135 ft</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
