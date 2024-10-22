import React, { createContext, ReactNode, useState } from "react";
import { WellData } from "../components/cesium/types";
import { wellDataFromRawData } from "./WellDataFileReader";

// Define the type for the context value
export interface ToolTipString {
    startDepth: number;
    endDepth: number;
    type: string[];
    lithologyDescription: string | null | undefined;
}

interface TooltipContextType {
    wellDataFromRawDataState: WellData[];
    selectedWellData: WellData | null;
    setWellDataFromRawData: React.Dispatch<React.SetStateAction<WellData[]>>;
    setSelectedWellData: React.Dispatch<React.SetStateAction<WellData | null>>;
}

// Create the context with initial values
export const TooltipContext = createContext<TooltipContextType>({
    selectedWellData: null,
    wellDataFromRawDataState: [],
    setWellDataFromRawData: () => {},
    setSelectedWellData: () => {},
});

// Define the props type for TooltipProvider
interface TooltipProviderProps {
    children: ReactNode;
}

// Create the TooltipProvider component
export const TooltipProvider: React.FC<TooltipProviderProps> = ({
    children,
}) => {
    const [tooltipString, setTooltipString] = useState<ToolTipString | string>(
        ""
    );
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const [wellDataFromRawDataState, setWellDataFromRawData] =
        useState<WellData[]>(wellDataFromRawData);
    const [selectedWellData, setSelectedWellData] = useState<WellData | null>(
        null
    );

    return (
        <TooltipContext.Provider
            value={{
                wellDataFromRawDataState,
                selectedWellData,
                setWellDataFromRawData,
                setSelectedWellData,
            }}
        >
            {children}
        </TooltipContext.Provider>
    );
};
