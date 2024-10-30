// StateAggregationsComponent.tsx

import centerOfMass from "@turf/center";
import cleanCoords from "@turf/clean-coords";
import rewind from "@turf/rewind";
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
    const thresholdHeight = 1609.34 * 50; // 80,467 meters (~80 km)
    const maxHeight = 1_000_000; // 1,000,000 meters (~1,000 km)
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const raisedHeight = 12000; // Adjust based on your visualization needs

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
                return;
            }

            const start = performance.now();

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;

            const shouldShow = cameraHeight >= maxHeight;

            // Only update state if there's a change
            if (showStates !== shouldShow) {
                setShowStates(shouldShow);
                setCameraPosition(cartographicPosition);
            }

            if (shouldShow) {
                console.log("shouldShow", shouldShow);
            }

            const end = performance.now();

            console.log("Camera change took", end - start, "ms");
        };

        const startInterval = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(handleCameraChange, 100); // Check every 100ms
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            handleCameraChange();
        };

        viewer?.camera.moveStart.addEventListener(startInterval);
        viewer?.camera.moveEnd.addEventListener(stopInterval);

        // Cleanup on unmount
        return () => {
            viewer?.camera.moveStart.removeEventListener(startInterval);
            viewer?.camera.moveEnd.removeEventListener(stopInterval);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [viewer, showStates, setCameraPosition, thresholdHeight, maxHeight]);

    // Convert GeoJSON geometry to PolygonHierarchy
    const convertGeometryToHierarchy = useCallback(
        (geometry: Geometry): PolygonHierarchy[] | undefined => {
            let feature: GeoJSON.Feature<Geometry> = {
                type: "Feature",
                geometry,
                properties: {},
            };

            feature = cleanCoords(feature) as GeoJSON.Feature<Geometry>;
            feature = rewind(feature, {
                reverse: true,
            }) as GeoJSON.Feature<Geometry>;

            const geom = feature.geometry;

            if (geom.type === "Polygon") {
                const positions = geom.coordinates[0].map(([lon, lat]) =>
                    Cartesian3.fromDegrees(lon, lat, raisedHeight)
                );

                const holes = geom.coordinates.slice(1).map((hole) => {
                    const holePositions = hole.map(([lon, lat]) =>
                        Cartesian3.fromDegrees(lon, lat, raisedHeight)
                    );
                    return new PolygonHierarchy(holePositions);
                });

                return [new PolygonHierarchy(positions, holes)];
            } else if (geom.type === "MultiPolygon") {
                return geom.coordinates.map((polygon) => {
                    const positions = polygon[0].map(([lon, lat]) =>
                        Cartesian3.fromDegrees(lon, lat, raisedHeight)
                    );

                    const holes = polygon.slice(1).map((hole) => {
                        const holePositions = hole.map(([lon, lat]) =>
                            Cartesian3.fromDegrees(lon, lat, raisedHeight)
                        );
                        return new PolygonHierarchy(holePositions);
                    });

                    return new PolygonHierarchy(positions, holes);
                });
            }
            return undefined;
        },
        [raisedHeight]
    );

    // Memoize the list of Entity components to prevent unnecessary re-renders
    const entities = useMemo(() => {
        if (!showStates || loading) return null;

        console.log("Rendering state aggregation component!");

        return stateFeatures.map((feature) => {
            const hierarchies = convertGeometryToHierarchy(feature.geometry);
            if (!hierarchies) return null;

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
        raisedHeight,
    ]);

    // Optional: Remove console logs to enhance performance
    // console.log("Rendering state aggregation component!");

    return <>{entities}</>;
};

export default StateAggregations;
