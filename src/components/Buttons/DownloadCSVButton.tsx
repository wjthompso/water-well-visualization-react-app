import React from "react";
import CSVIcon from "../../assets/CSVIcon.svg";
import { convertWellDataToCSV } from "../../utilities/csvUtils";

interface DownloadCSVButtonProps {
    selectedWellData: any; // Replace `any` with the correct type for WellData if you have one
}

const DownloadCSVButton: React.FC<DownloadCSVButtonProps> = ({
    selectedWellData,
}) => {
    const handleDownload = () => {
        if (!selectedWellData) return;

        // Convert well data to CSV
        const csv = convertWellDataToCSV(selectedWellData);

        // Create a Blob from the CSV string
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        // Create a temporary download link and trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${selectedWellData.StateWellID}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            className="flex justify-center w-[128px] text-[12px] items-center h-[34px] font-semibold text-black bg-[#E5E5E5] rounded-md hover:bg-[#E6E6E6] active:bg-white border border-[2px] border-borderColor"
            onClick={handleDownload}
        >
            <img
                src={CSVIcon}
                alt="CSV Icon"
                className="mr-1"
            />
            DRILL REPORT
        </button>
    );
};

export default DownloadCSVButton;
