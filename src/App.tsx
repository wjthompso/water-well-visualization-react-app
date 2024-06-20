import "./App.css";
import CesiumViewer from "./components/cesium/CesiumViewer";
import Header from "./components/Header/Header";

import { Ion } from "cesium";
import { RightSideBar } from "./components/RightSidebar/RightSideBar";

// Set your Cesium Ion access token
Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZDcyZjFjOC01N2VhLTRhZTUtOWYyOS00YmNmZTQyOGJjODUiLCJpZCI6MjAxNDE3LCJpYXQiOjE3MTAyODU3Mjh9.wXyYiKPfxEFT98YGAbzjSykTtlOHl0ekEYNovyWooQ4";

function App() {
    return (
        <>
            <Header />
            <div className="relative flex-1 h-[calc(100vh-89px)] bg-yellow-400">
                <CesiumViewer />
                <RightSideBar></RightSideBar>
            </div>
        </>
    );
}

export default App;
