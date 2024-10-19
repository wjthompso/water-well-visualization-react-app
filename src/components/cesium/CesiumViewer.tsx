// src/components/cesium/CesiumViewer.tsx

import {
    Cartesian3,
    Color as CesiumColor,
    Viewer as CesiumViewerInstance,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Viewer } from "resium";
import "../../App.css";

import { TooltipContext } from "../../context/AppContext";
import DraggableComponent from "../DraggableFooter/DraggableFooter";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CustomSearchBar from "../Searchbar/CustomSearchbar";
import CountyAggregations from "./CountyAggregations";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import StateAggregations from "./StateAggregationComponent";
import Tooltip from "./Tooltip";
import WaterWells from "./WaterWells";
import { Chunk, SubChunkedWellData, WellData } from "./types";

import { createLocationKey } from "../../utilities/chunkUtils";

// Custom hooks
import useCameraControls from "./hooks/useCameraControls";
import useQuadrants from "./hooks/useQuadrants";
import useTerrainData from "./hooks/useTerrainData";

const CesiumViewerComponent: React.FC = () => {
    // Constants
    const minLat = 24.536111;
    const maxLat = 49.36843957;
    const minLon = -124.592902859999;
    const maxLon = -67.4433;
    const chunkSplitN = 119;
    const terrainFlatteningThreshold = 1_500_000; // 1,500,000 meters
    const thresholdHeight = 1609.34 * 50; // Approximately 50 miles in meters

    const latStep = (maxLat - minLat) / chunkSplitN;
    const lonStep = (maxLon - minLon) / chunkSplitN;

    // Refs
    const viewerRef = useRef<CesiumViewerInstance | null>(null);
    const parentRefForDraggableComponent = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);

    // State
    const [currentQuadrant, setCurrentQuadrant] = useState<
        Chunk | null | undefined
    >(null);
    const [
        wellDataWithoutElevationAdjustments,
        setWellDataWithoutElevationAdjustments,
    ] = useState<WellData[] | SubChunkedWellData>([]);
    const [showWells, setShowWells] = useState<boolean>(true);
    const [showAggregations, setShowAggregations] = useState<boolean>(true);
    const [finishedLoading, setFinishedLoading] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [terrainHeightsLoaded, setTerrainHeightsLoaded] =
        useState<boolean>(false);
    const [viewerReady, setViewerReady] = useState<boolean>(false); // New state variable

    const { setTooltipString } = useContext(TooltipContext);

    // Custom Hooks
    const { terrainProvider, isLoading: isTerrainLoading } = useTerrainData();
    const { quadrantsMapRef } = useQuadrants();

    // Use Camera Controls Hook
    useCameraControls({
        viewerRef,
        quadrantsMapRef,
        minLat,
        minLon,
        latStep,
        lonStep,
        chunkSplitN,
        terrainFlatteningThreshold,
        thresholdHeight,
        setCurrentQuadrant,
        setWellData: setWellDataWithoutElevationAdjustments,
        setShowWells,
        setShowAggregations,
        setFinishedLoading,
        setInitialLoading,
        setTerrainHeightsLoaded,
        setTooltipString,
        viewerReady, // Pass viewerReady to the hook
    });

    // Calculate chunk outline positions based on current quadrant
    const chunkOutlinePositions = useMemo(() => {
        if (!currentQuadrant) return null;
        const { topLeft, bottomRight } = currentQuadrant;

        const topRight = { lat: topLeft.lat, lon: bottomRight.lon };
        const bottomLeft = { lat: bottomRight.lat, lon: topLeft.lon };

        const positions = [
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
            Cartesian3.fromDegrees(topRight.lon, topRight.lat),
            Cartesian3.fromDegrees(bottomRight.lon, bottomRight.lat),
            Cartesian3.fromDegrees(bottomLeft.lon, bottomLeft.lat),
            Cartesian3.fromDegrees(topLeft.lon, topLeft.lat),
        ];
        return positions;
    }, [currentQuadrant]);

    // Reposition toolbar on window resize
    useEffect(() => {
        const repositionToolbar = () => {
            const viewerCesium = viewerRef.current;
            if (viewerCesium) {
                const container = viewerCesium.container;
                const toolbar = container.querySelector<HTMLDivElement>(
                    ".cesium-viewer-toolbar"
                );

                if (toolbar) {
                    toolbar.style.top = "2.5rem";
                    if (window.innerWidth < 768) {
                        toolbar.style.left = "-5rem";
                        toolbar.style.right = "auto";
                    } else {
                        toolbar.style.left = "-5rem";
                        toolbar.style.right = "auto";
                    }
                }
            }
        };

        window.addEventListener("resize", repositionToolbar);

        // Initial reposition
        repositionToolbar();

        return () => {
            window.removeEventListener("resize", repositionToolbar);
        };
    }, []);

    // Added console logs for debugging
    useEffect(() => {
        console.log("Terrain loading state variables:");
        console.log("isTerrainLoading:", isTerrainLoading);
        console.log("terrainHeightsLoaded:", terrainHeightsLoaded);
        console.log("terrainProvider:", terrainProvider);
        console.log(
            "wellDataWithoutElevationAdjustments:",
            wellDataWithoutElevationAdjustments
        );
        console.log("viewerRef.current:", viewerRef.current);
        console.log(
            "parentRefForDraggableComponent.current:",
            parentRefForDraggableComponent.current
        );
    }, [
        isTerrainLoading,
        terrainHeightsLoaded,
        terrainProvider,
        wellDataWithoutElevationAdjustments,
        viewerRef.current,
        parentRefForDraggableComponent.current,
    ]);

    if (isTerrainLoading || !terrainProvider) {
        console.log("Terrain is loading or terrainProvider is undefined");
        return (
            <div className="flex items-center justify-center w-full h-full md:pr-[272px] bg-headerBackgroundColor z-50">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div
            id="cesium-viewer-plus-widgets"
            className="relative box-border w-[100vw] h-full p-0 m-0 overflow-hidden"
            ref={parentRefForDraggableComponent}
        >
            {initialLoading && (
                <div className="flex items-center justify-center w-full h-full md:pr-[272px] bg-headerBackgroundColor z-[100]">
                    <LoadingSpinner />
                </div>
            )}
            <CustomSearchBar
                viewerRef={viewerRef}
                searchBarRef={searchBarRef}
            />
            <DraggableComponent
                parentRef={parentRefForDraggableComponent}
                searchBarRef={searchBarRef}
            />
            <div
                id="cesium-viewer-container"
                className="relative w-[100%] h-[100%] overflow-hidden"
            >
                <Viewer
                    full
                    ref={(viewer) => {
                        if (viewer && viewer.cesiumElement) {
                            viewerRef.current = viewer.cesiumElement;
                            console.log("Viewer created:", viewerRef.current);
                            setViewerReady(true);
                        }
                    }}
                    terrainProvider={terrainProvider}
                    orderIndependentTranslucency={false}
                    fullscreenButton={false}
                    animation={false}
                    timeline={false}
                    navigationHelpButton={false}
                    homeButton={false}
                    baseLayerPicker={true}
                    geocoder={false}
                    selectionIndicator={false}
                    infoBox={false}
                >
                    {showWells &&
                        terrainHeightsLoaded &&
                        wellDataWithoutElevationAdjustments &&
                        ((Array.isArray(wellDataWithoutElevationAdjustments) &&
                            wellDataWithoutElevationAdjustments.length > 0) ||
                            (!Array.isArray(
                                wellDataWithoutElevationAdjustments
                            ) &&
                                wellDataWithoutElevationAdjustments.sub_chunks
                                    .length > 0)) && (
                            <WaterWells
                                key={
                                    currentQuadrant
                                        ? createLocationKey(currentQuadrant)
                                        : "no-quadrant"
                                }
                                terrainProvider={terrainProvider}
                                wellDataWithoutElevationAdjustments={
                                    wellDataWithoutElevationAdjustments
                                }
                                viewerRef={viewerRef}
                            />
                        )}

                    {chunkOutlinePositions && showWells && (
                        <GroundPolylinePrimitiveComponent
                            positions={chunkOutlinePositions}
                            width={2.0}
                            color={CesiumColor.WHITE}
                        />
                    )}

                    {finishedLoading &&
                        viewerRef.current &&
                        showAggregations && (
                            <>
                                <StateAggregations viewer={viewerRef.current} />
                                <CountyAggregations
                                    viewer={viewerRef.current}
                                />
                            </>
                        )}
                </Viewer>
                <Tooltip />
            </div>
        </div>
    );
};

export default CesiumViewerComponent;
