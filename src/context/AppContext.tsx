import React, { createContext, ReactNode, useState } from "react";
import { WellData } from "./WellData";
import { wellDataFromRawData } from "./WellDataFileReader";

// Define the type for the context value
export interface ToolTipString {
    startDepth: number;
    endDepth: number;
    type: string[];
    lithologyDescription: string | null | undefined;
}

interface TooltipContextType {
    tooltipX: number;
    tooltipY: number;
    tooltipString: ToolTipString | string;
    wellDataFromRawDataState: WellData[];
    selectedWellData: WellData | null;
    setTooltipX: React.Dispatch<React.SetStateAction<number>>;
    setTooltipY: React.Dispatch<React.SetStateAction<number>>;
    setTooltipString: React.Dispatch<
        React.SetStateAction<ToolTipString | string>
    >;
    setWellDataFromRawData: React.Dispatch<React.SetStateAction<WellData[]>>;
    setSelectedWellData: React.Dispatch<React.SetStateAction<WellData | null>>;
}

// Create the context with initial values
export const TooltipContext = createContext<TooltipContextType>({
    tooltipString: {
        startDepth: 0,
        endDepth: 0,
        type: [],
        lithologyDescription: "",
    },
    tooltipX: 0,
    tooltipY: 0,
    selectedWellData: null,
    wellDataFromRawDataState: [],
    setTooltipString: () => {},
    setTooltipX: () => {},
    setTooltipY: () => {},
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
                tooltipString,
                tooltipX,
                tooltipY,
                wellDataFromRawDataState,
                selectedWellData,
                setTooltipString,
                setTooltipX,
                setTooltipY,
                setWellDataFromRawData,
                setSelectedWellData,
            }}
        >
            {children}
        </TooltipContext.Provider>
    );
};
