import React from "react";
import CopyIcon from "../../assets/CopyIcon.svg";

interface CopyCoordinatesButtonProps {
    latitude: number;
    longitude: number;
}

const CopyCoordinatesButton: React.FC<CopyCoordinatesButtonProps> = ({
    latitude,
    longitude,
}) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(`${latitude},${longitude}`);
    };

    return (
        <div className="flex items-center justify-center row-span-2">
            <button
                className="flex items-center justify-center w-7 h-7 rounded-full bg-[#6A6A6A] active:bg-[#8C8C8C] transition-colors"
                onClick={handleCopy}
            >
                <img
                    src={CopyIcon}
                    alt="Copy Latitude"
                />
            </button>
        </div>
    );
};

export default CopyCoordinatesButton;
