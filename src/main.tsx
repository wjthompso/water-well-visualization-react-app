import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { TooltipProvider } from "./context/AppContext.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <TooltipProvider>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </TooltipProvider>
);
