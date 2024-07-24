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
    setTooltipX: React.Dispatch<React.SetStateAction<number>>;
    setTooltipY: React.Dispatch<React.SetStateAction<number>>;
    setTooltipString: React.Dispatch<
        React.SetStateAction<ToolTipString | string>
    >;
    setWellDataFromRawData: React.Dispatch<React.SetStateAction<WellData[]>>;
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
    const [tooltipString, setTooltipString] = useState<ToolTipString | string>(
        ""
    );
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const [wellDataFromRawDataState, setWellDataFromRawData] =
        useState<WellData[]>(wellDataFromRawData);

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
