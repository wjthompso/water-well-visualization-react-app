// useTooltip.js
import { useContext } from "react";
import { TooltipContext } from "./AppContext"; // Adjust the import path as necessary

export const useTooltip = () => useContext(TooltipContext);
