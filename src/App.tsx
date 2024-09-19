import { useEffect } from "react";
import "./App.css";
import CesiumViewer from "./components/cesium/CesiumViewer";
import Header from "./components/Header/Header";

import { Ion } from "cesium";
import Legend from "./components/Legend/Legend";
import RightSideBar from "./components/RightSidebar/RightSideBar";

// Set your Cesium Ion access token
Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZDcyZjFjOC01N2VhLTRhZTUtOWYyOS00YmNmZTQyOGJjODUiLCJpZCI6MjAxNDE3LCJpYXQiOjE3MTAyODU3Mjh9.wXyYiKPfxEFT98YGAbzjSykTtlOHl0ekEYNovyWooQ4";

function App() {
    // For dynamic height, particularly on mobile devices
    useEffect(() => {
        // Function to set the dynamic height
        const setDynamicHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        };

        // Set the initial height
        setDynamicHeight();

        // Add event listeners to update height on window resize or orientation change
        window.addEventListener("resize", setDynamicHeight);
        window.addEventListener("orientationchange", setDynamicHeight);

        // Cleanup event listeners on unmount
        return () => {
            window.removeEventListener("resize", setDynamicHeight);
            window.removeEventListener("orientationchange", setDynamicHeight);
        };
    }, []);

    return (
        <>
            <Header />
            <div className="relative flex-1 h-full-cesium-height md:h-mobile-cesium-height bg-headerBackgroundColor">
                <CesiumViewer />
                <RightSideBar></RightSideBar>
                <Legend></Legend>
            </div>
        </>
    );
}

export default App;
