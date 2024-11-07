import React from "react";
import PDFIcon from "../../assets/PDFIcon.svg";

interface DownloadDrillReportPDFButtonProps {
    drillNotesPDF: string; // Assuming drillReportPDFLink is a string URL
}

const DownloadDrillReportPDFButton: React.FC<
    DownloadDrillReportPDFButtonProps
> = ({ drillNotesPDF }) => {
    return (
        <a
            href={drillNotesPDF}
            className="flex justify-center w-[128px] text-[12px] items-center h-[34px] font-semibold text-black bg-[#E5E5E5] rounded-md hover:bg-[#E6E6E6] active:bg-white border border-[2px] border-borderColor"
            target="_blank"
            rel="noopener noreferrer"
        >
            <img
                src={PDFIcon}
                alt="CSV Icon"
                className="mr-1"
            />
            DRILL REPORT
        </a>
    );
};

export default DownloadDrillReportPDFButton;
