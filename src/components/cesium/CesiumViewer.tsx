import {
    Cartesian3,
    CesiumTerrainProvider,
    Viewer as CesiumViewer,
    Math,
    createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import React, { useEffect, useRef, useState } from "react";
import { CesiumComponentRef, Viewer } from "resium";
import "../../App.css";
import CylinderEntities from "./CylinderEntities";
import Tooltip from "./Tooltip";

function moveCameraToDangermond(viewer: CesiumViewer) {
    const cameraLongitude = -120.462283;
    const cameraLatitude = 34.424167;
    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(
            cameraLongitude,
            cameraLatitude,
            5000
        ),
        orientation: {
            heading: Math.toRadians(0),
            pitch: Math.toRadians(-60),
            roll: 0.0,
        },
    });
}

function enableUndergroundView(viewer: CesiumViewer) {
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
}

function makeGroundTranslucentAsYouGetCloser(viewer: CesiumViewer) {
    const globe = viewer.scene.globe;
    globe.depthTestAgainstTerrain = true;
    globe.translucency.enabled = true;
    const scene = viewer.scene;
    scene.camera.changed.addEventListener(function () {
        const cameraHeight = scene.camera.positionCartographic.height;
        if (cameraHeight < 700) {
            globe.translucency.frontFaceAlpha = 0.5;
        } else {
            globe.translucency.frontFaceAlpha = 1;
        }
    });
}

const ResiumViewerComponent: React.FC = () => {
    const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
    const [terrainProvider, setTerrainProvider] = useState<
        CesiumTerrainProvider | undefined
    >(undefined);
    const hasLoadedTerrainData = useRef(false);

    useEffect(() => {
        const loadTerrainData = async () => {
            const terrainData = await createWorldTerrainAsync();
            setTerrainProvider(terrainData);
            hasLoadedTerrainData.current = true;
        };

        loadTerrainData();

        const checkViewerReady = setInterval(() => {
            if (viewerRef.current?.cesiumElement) {
                const viewer = viewerRef.current.cesiumElement;
                clearInterval(checkViewerReady);
                enableUndergroundView(viewer);
                moveCameraToDangermond(viewer);
                makeGroundTranslucentAsYouGetCloser(viewer);

                // Repositioning controls
                const container = viewer.container;
                const toolbar: HTMLDivElement | null = container.querySelector(
                    ".cesium-viewer-toolbar"
                );
                const bottomContainer: HTMLDivElement | null =
                    container.querySelector(".cesium-viewer-bottom");

                if (toolbar) {
                    toolbar.style.top = "10px";
                    toolbar.style.right = "275px";
                }

                if (bottomContainer) {
                    bottomContainer.style.bottom = "10px";
                    bottomContainer.style.right = "275px";
                }
            }
        }, 100);

        return () => clearInterval(checkViewerReady);
    }, []);

    if (!terrainProvider) {
        return <div>Loading terrain data...</div>;
    }

    return (
        <div className="box-border w-[100vw] h-full p-0 m-0">
            <div className="relative w-[100%] h-[100%]">
                <Viewer
                    full
                    ref={viewerRef}
                    terrainProvider={terrainProvider}
                    orderIndependentTranslucency={false}
                    fullscreenButton={false}
                >
                    <CylinderEntities terrainProvider={terrainProvider} />
                </Viewer>
                <Tooltip />
            </div>
        </div>
    );
};

export default ResiumViewerComponent;
