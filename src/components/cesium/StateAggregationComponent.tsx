// StateAggregationsComponent.tsx

import centerOfMass from "@turf/center";
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
    convertGeometryToHierarchy,
    fixPolygonToMultiPolygon,
} from "../../utilities/geometryUtils"; // Import the shared utility

interface StateAggregationsProps {
    viewer: CesiumViewer;
}

interface StateFeature {
    name: string;
    geometry: Geometry;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const StateAggregations: React.FC<StateAggregationsProps> = ({ viewer }) => {
    const [stateFeatures, setStateFeatures] = useState<StateFeature[]>([]);
    const [showStates, setShowStates] = useState<boolean>(false);
    const { setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const maxHeight = 1_000_000; // 1,000,000 meters (~1,000 km)
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const raisedHeight = 12_000; // Adjust based on your visualization needs

    // Ref to store the previous stateFeatures for comparison
    const prevStateFeaturesRef = useRef<StateFeature[]>([]);

    // Calculate centroid of a geometry
    const calculateCentroid = useCallback(
        (geometry: Geometry): { lat: number; lon: number } => {
            const centroidFeature = centerOfMass({
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry,
                        properties: {},
                    },
                ],
            });
            const [lon, lat] = centroidFeature.geometry.coordinates;
            return { lat, lon };
        },
        []
    );

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
                        const centroid = calculateCentroid(feature.geometry);

                        return {
                            name: feature.name,
                            geometry: feature.geometry,
                            wellCount,
                            centroid,
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
    }, [statePolygons, loading, calculateCentroid]);

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
    }, []); // Empty dependency array ensures listeners are added only once on mount

    // Convert GeoJSON geometry to PolygonHierarchy
    const convertGeometry = useCallback((geometry: Geometry): Geometry => {
        if (geometry.type === "Polygon" && geometry.coordinates.length > 1) {
            // Convert to MultiPolygon
            return fixPolygonToMultiPolygon(geometry);
        }
        return geometry;
    }, []);

    // Memoize the list of Entity components to prevent unnecessary re-renders
    let accumulator = 0;
    const entities = useMemo(() => {
        if (!showStates || loading) return null;

        const startTime = performance.now();

        return stateFeatures.map((feature) => {
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

            if (!hierarchies) return null;

            const endTime = performance.now();

            accumulator += endTime - startTime;

            return hierarchies.map((hierarchy, index) => {
                return (
                    <Entity
                        key={`${feature.name}-${index}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat,
                            raisedHeight
                        )}
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
                        {/* Label */}
                        <LabelGraphics
                            text={feature.wellCount.toLocaleString()}
                            font="15pt sans-serif"
                            fillColor={Color.WHITE}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={LabelStyle.FILL_AND_OUTLINE}
                            verticalOrigin={VerticalOrigin.CENTER}
                            horizontalOrigin={HorizontalOrigin.CENTER}
                            pixelOffset={Cartesian3.ZERO}
                            disableDepthTestDistance={Number.POSITIVE_INFINITY}
                            scaleByDistance={
                                new NearFarScalar(5.0e5, 1.5, 5.0e6, 0.75)
                            }
                            eyeOffset={new Cartesian3(0.0, 0.0, -4000.0)} // Adjust as needed
                        />
                    </Entity>
                );
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

    // Optional: Remove console logs to enhance performance
    // console.log("Rendering state aggregation component!");

    return <>{entities}</>;
};

export default React.memo(StateAggregations);
