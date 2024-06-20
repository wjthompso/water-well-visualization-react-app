import React, { createContext, useState, ReactNode } from "react";
import { WellData } from "./WellData";
import { wellDataFromRawData } from "./WellDataFileReader";

// Define the type for the context value
interface TooltipContextType {
    tooltipX: number;
    tooltipY: number;
    tooltipString: string;
    wellDataFromRawDataState: WellData[];
    setTooltipX: React.Dispatch<React.SetStateAction<number>>;
    setTooltipY: React.Dispatch<React.SetStateAction<number>>;
    setTooltipString: React.Dispatch<React.SetStateAction<string>>;
    setWellDataFromRawData: React.Dispatch<React.SetStateAction<WellData[]>>;
}

// Create the context with initial values
export const TooltipContext = createContext<TooltipContextType>({
    tooltipString: "",
    tooltipX: 0,
    tooltipY: 0,
    wellDataFromRawDataState: [],
    setTooltipString: () => {},
    setTooltipX: () => {},
    setTooltipY: () => {},
    setWellDataFromRawData: () => {},
});

// Define the props type for TooltipProvider
interface TooltipProviderProps {
    children: ReactNode;
}

// Create the TooltipProvider component
export const TooltipProvider: React.FC<TooltipProviderProps> = ({
    children,
}) => {
    const [tooltipString, setTooltipString] = useState<string>("");
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const [wellDataFromRawDataState, setWellDataFromRawData] =
        useState<WellData[]>(wellDataFromRawData);

    // console.log("Excel data from context:", wellDataFromRawData);

    return (
        <TooltipContext.Provider
            value={{
                tooltipString,
                tooltipX,
                tooltipY,
                wellDataFromRawDataState,
                setTooltipString,
                setTooltipX,
                setTooltipY,
                setWellDataFromRawData,
            }}
        >
            {children}
        </TooltipContext.Provider>
    );
};
