import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { TooltipProvider } from "./context/AppContext.tsx";
import { CameraPositionProvider } from "./context/CameraPositionContext"; // Import the new context
import { StatePolygonProvider } from "./context/StatePolygonContext"; // Import the new context
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StatePolygonProvider>
        <CameraPositionProvider>
            <TooltipProvider>
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </TooltipProvider>
        </CameraPositionProvider>
    </StatePolygonProvider>
);
