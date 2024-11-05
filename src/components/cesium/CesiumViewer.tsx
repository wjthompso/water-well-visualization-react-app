// src/components/cesium/CesiumViewer.tsx

import { Color as CesiumColor, Viewer as CesiumViewerInstance } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Viewer } from "resium";
import "../../App.css";

import DraggableComponent from "../DraggableFooter/DraggableFooter";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CustomSearchBar from "../Searchbar/CustomSearchbar";
import CountyAggregations from "./CountyAggregations";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent";
import StateAggregations from "./StateAggregationComponent";
import Tooltip from "./Tooltip";
import WaterWells from "./WaterWells";
import { Chunk, SubChunkedWellData, WellData } from "./types";

import {
    computeChunkOutlinePositions,
    createLocationKey,
} from "../../utilities/chunkUtils";
import LeftSidebar from "../LeftSidebar/LeftSidebar";

// Custom hooks
import ZoomControls from "../Buttons/ZoomControls";
import useCameraControls from "./CesiumViewerHooks/useCameraControls";
import useQuadrants from "./CesiumViewerHooks/useQuadrants";
import useTerrainData from "./CesiumViewerHooks/useTerrainData";

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
        showAggregations,
        setCurrentQuadrant,
        setWellData: setWellDataWithoutElevationAdjustments,
        setShowWells,
        setShowAggregations,
        setFinishedLoading,
        setInitialLoading,
        setTerrainHeightsLoaded,
        viewerReady, // Pass viewerReady to the hook
    });

    // Calculate chunk outline positions based on current quadrant using the utility function
    const chunkOutlinePositions = useMemo(() => {
        return computeChunkOutlinePositions(currentQuadrant);
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

    // Add a useEffect to log when showAggregations changes (currently empty, consider adding logic)
    useEffect(() => {
        // You can add logging or other side effects here if needed
    }, [showAggregations, viewerRef.current, finishedLoading]);

    // Show loading spinner if terrain is loading
    if (isTerrainLoading || !terrainProvider) {
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
            <LeftSidebar />
            <CustomSearchBar
                viewer={viewerRef.current ?? undefined}
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
                                wellDataWithoutElevationAdjustments={
                                    wellDataWithoutElevationAdjustments
                                }
                                viewer={viewerRef.current ?? null}
                            />
                        )}

                    {chunkOutlinePositions && showWells && (
                        <GroundPolylinePrimitiveComponent
                            positions={chunkOutlinePositions}
                            width={2.0}
                            color={CesiumColor.WHITE}
                        />
                    )}

                    {finishedLoading && viewerRef.current && (
                        <>
                            <StateAggregations viewer={viewerRef.current} />
                            <CountyAggregations viewer={viewerRef.current} />
                        </>
                    )}
                </Viewer>
                <ZoomControls viewer={viewerRef.current} />
                <Tooltip />
            </div>
        </div>
    );
};

export default CesiumViewerComponent;
