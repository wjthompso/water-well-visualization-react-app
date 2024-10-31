// StateAggregationsComponent.tsx

import {
    Cartesian3,
    Viewer as CesiumViewer,
    Color,
    HorizontalOrigin,
    LabelStyle,
    NearFarScalar,
    PolygonHierarchy,
    VerticalOrigin,
} from "cesium";
import { Geometry } from "geojson";
import isEqual from "lodash.isequal"; // Ensure lodash.isequal is installed
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Entity,
    LabelGraphics,
    PolygonGraphics,
    PolylineGraphics,
} from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";
import {
    calculateVisualCenter,
    convertGeometryToHierarchy,
    fixPolygonToMultiPolygon,
} from "../../utilities/geometryUtils"; // Import the shared utility

// Define the custom label positions mapping (optional if you still want overrides)
const customLabelPositions: {
    [stateName: string]: { lat: number; lon: number };
} = {
    // Michigan: 43.056967, -84.705578
    Michigan: { lat: 43.056967, lon: -84.705578 },
};

interface StateAggregationsProps {
    viewer: CesiumViewer;
}

interface StateFeature {
    name: string;
    geometry: Geometry;
    wellCount: number;
    visualCenter: { lat: number; lon: number };
}

const StateAggregations: React.FC<StateAggregationsProps> = ({ viewer }) => {
    const [stateFeatures, setStateFeatures] = useState<StateFeature[]>([]);
    const [showStates, setShowStates] = useState<boolean>(false);
    const { setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const maxHeight = 1_000_000; // 1,000,000 meters (~1,000 km)
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const raisedHeight = 18_000; // Adjust based on your visualization needs

    // Ref to store the previous stateFeatures for comparison
    const prevStateFeaturesRef = useRef<StateFeature[]>([]);

    // Fetch and set state features
    useEffect(() => {
        const fetchData = async () => {
            try {
                const aggregationsResponse = await fetch(
                    "https://waterwelldepthmap.bren.ucsb.edu/api/state-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                const combinedData: StateFeature[] = statePolygons.map(
                    (feature) => {
                        const wellCount = aggregationsData[feature.name] || 0;
                        const visualCenter = calculateVisualCenter(
                            feature.geometry
                        );

                        return {
                            name: feature.name,
                            geometry: feature.geometry,
                            wellCount,
                            visualCenter,
                        };
                    }
                );

                // Prevent unnecessary state updates using deep comparison
                if (!isEqual(combinedData, prevStateFeaturesRef.current)) {
                    setStateFeatures(combinedData);
                    prevStateFeaturesRef.current = combinedData;
                }
            } catch (error) {
                console.error("Error fetching state data:", error);
            }
        };

        if (!loading) {
            fetchData();
        }
    }, [statePolygons, loading, calculateVisualCenter]);

    // Handle camera changes with optimized state updates
    useEffect(() => {
        const handleCameraChange = () => {
            if (!viewer?.scene) {
                console.error("Viewer or scene is not available!");
                return;
            }

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;

            const shouldShow = cameraHeight >= maxHeight;

            setShowStates(shouldShow);
            setCameraPosition(cartographicPosition);
        };

        const startInterval = () => {
            if (intervalRef.current === null) {
                intervalRef.current = setInterval(handleCameraChange, 300); // Check every 300ms
            }
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            handleCameraChange(); // Final camera check after movement stops
        };

        // Adding listeners only once when the component mounts
        viewer?.camera.moveStart.addEventListener(startInterval);
        viewer?.camera.moveEnd.addEventListener(stopInterval);

        // Cleanup on unmount to avoid adding/removing listeners unnecessarily
        return () => {
            viewer?.camera.moveStart.removeEventListener(startInterval);
            viewer?.camera.moveEnd.removeEventListener(stopInterval);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [viewer, maxHeight, setCameraPosition]); // Added dependencies for completeness

    // Convert GeoJSON geometry to PolygonHierarchy
    const convertGeometry = useCallback((geometry: Geometry): Geometry => {
        if (geometry.type === "Polygon" && geometry.coordinates.length > 1) {
            // Convert to MultiPolygon
            return fixPolygonToMultiPolygon(geometry);
        }
        return geometry;
    }, []);

    // Memoize the list of Entity components to prevent unnecessary re-renders
    const entities = useMemo(() => {
        if (!showStates || loading) return null;

        return stateFeatures.flatMap((feature) => {
            let geometry = feature.geometry;

            let hierarchies: PolygonHierarchy[] | undefined;
            try {
                hierarchies = convertGeometryToHierarchy(
                    geometry,
                    raisedHeight
                );
            } catch (error) {
                console.error("Error converting geometry to hierarchy:", error);
                hierarchies = undefined;
            }

            if (!hierarchies) return [];

            return hierarchies.map((hierarchy, index) => {
                // Use visualCenter for label position
                const customLabelPosition = customLabelPositions[feature.name];
                let labelPosition: Cartesian3;
                if (customLabelPosition) {
                    labelPosition = Cartesian3.fromDegrees(
                        customLabelPosition.lon,
                        customLabelPosition.lat,
                        raisedHeight
                    );
                } else {
                    labelPosition = Cartesian3.fromDegrees(
                        feature.visualCenter.lon,
                        feature.visualCenter.lat,
                        raisedHeight
                    );
                }

                const polygonPosition = Cartesian3.fromDegrees(
                    feature.visualCenter.lon,
                    feature.visualCenter.lat,
                    raisedHeight
                );

                return [
                    // Polygon Entity
                    <Entity
                        key={`polygon-${feature.name}-${index}`}
                        position={polygonPosition}
                    >
                        {/* Polygon Fill */}
                        <PolygonGraphics
                            hierarchy={hierarchy}
                            material={Color.BLUE.withAlpha(0.5)}
                        />
                        {/* Polygon Outline */}
                        <PolylineGraphics
                            positions={hierarchy.positions}
                            width={2} // Adjust for thicker outlines
                            material={Color.WHITE}
                        />
                    </Entity>,

                    // Label Entity
                    <Entity
                        key={`label-${feature.name}-${index}`}
                        position={labelPosition}
                    >
                        <LabelGraphics
                            text={feature.wellCount.toLocaleString()}
                            font="15pt sans-serif"
                            fillColor={Color.WHITE}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={LabelStyle.FILL_AND_OUTLINE}
                            verticalOrigin={VerticalOrigin.CENTER}
                            horizontalOrigin={HorizontalOrigin.CENTER}
                            disableDepthTestDistance={Number.POSITIVE_INFINITY}
                            scaleByDistance={
                                new NearFarScalar(5.0e5, 1.5, 5.0e6, 0.75)
                            }
                            eyeOffset={new Cartesian3(0.0, 0.0, -4000.0)} // Adjust as needed
                        />
                    </Entity>,
                ];
            });
        });
    }, [
        stateFeatures,
        showStates,
        loading,
        convertGeometryToHierarchy,
        convertGeometry,
        raisedHeight,
    ]);

    return <>{entities}</>;
};

export default React.memo(StateAggregations);
