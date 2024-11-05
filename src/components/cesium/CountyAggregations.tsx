// CountyAggregations.tsx

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import centerOfMass from "@turf/center";
import cleanCoords from "@turf/clean-coords";
import { point } from "@turf/helpers";
import rewind from "@turf/rewind";
import {
    Cartesian3,
    Math as CesiumMath,
    Viewer as CesiumViewer,
    Color,
    HorizontalOrigin,
    LabelStyle,
    NearFarScalar,
    PolygonHierarchy,
    VerticalOrigin,
} from "cesium";
import { Geometry, Position } from "geojson";
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
import { getGradientColor } from "../../utilities/colorUtils"; // Import the gradient utility
import {
    calculateVisualCenter,
    fromDegrees,
} from "../../utilities/geometryUtils"; // Ensure this path is correct

interface CountyAggregationsProps {
    viewer: CesiumViewer;
}

interface CountyFeature {
    name: string;
    geometry: Geometry;
    wellCount: number;
    visualCenter: { lat: number; lon: number };
}

const CountyAggregations: React.FC<CountyAggregationsProps> = ({ viewer }) => {
    const { cameraPosition, setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
    const [showCounties, setShowCounties] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const raisedHeight = 9000; // Adjust based on your visualization needs

    // Define the min and max well counts for the gradient
    const MIN_WELL_COUNT = 40;
    const MAX_WELL_COUNT = 1_500;

    /**
     * Calculates the visual center of a geometry.
     * Cleans and rewinds the geometry before calculation.
     * Falls back to centroid if calculation fails.
     */
    const calculateVisualCenterCallback = useCallback(
        (geometry: Geometry): { lat: number; lon: number } => {
            try {
                // Wrap the geometry into a Feature
                let feature: GeoJSON.Feature<Geometry> = {
                    type: "Feature",
                    geometry: geometry,
                    properties: {},
                };

                // Clean up the geometry
                feature = cleanCoords(feature) as GeoJSON.Feature<Geometry>;

                // Ensure correct winding order
                feature = rewind(feature, {
                    reverse: true,
                }) as GeoJSON.Feature<Geometry>;

                const cleanedGeometry = feature.geometry;

                // Calculate visual center
                const visualCenter = calculateVisualCenter(cleanedGeometry);

                // Validate visual center coordinates
                if (
                    visualCenter.lat == null ||
                    visualCenter.lon == null ||
                    isNaN(visualCenter.lat) ||
                    isNaN(visualCenter.lon)
                ) {
                    throw new Error("Invalid visual center coordinates");
                }

                // Log visual center for debugging
                console.log(
                    `Visual center for geometry for county: `,
                    visualCenter
                );

                return visualCenter;
            } catch (error) {
                console.error("Error calculating visual center:", error);
                // Fallback to centroid
                const centroidFeature = centerOfMass({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: geometry,
                            properties: {},
                        },
                    ],
                });
                const [lon, lat] = centroidFeature.geometry.coordinates;
                console.log(`Fallback centroid:`, { lat, lon });
                return { lat, lon };
            }
        },
        []
    );

    /**
     * Sets the selected state based on the camera position.
     * This determines which state's counties to display.
     */
    useEffect(() => {
        if (!cameraPosition || loading || statePolygons.length === 0) {
            return;
        }

        const currentLat = CesiumMath.toDegrees(cameraPosition.latitude);
        const currentLon = CesiumMath.toDegrees(cameraPosition.longitude);
        const pointFeature = point([currentLon, currentLat]);

        const state = statePolygons.find((state) =>
            booleanPointInPolygon(pointFeature, state.geometry)
        );

        if (selectedState !== state?.name) {
            setSelectedState(state ? state.name : null);
        }
    }, [cameraPosition, statePolygons, loading, selectedState]);

    /**
     * Fetches county aggregation data when the selected state changes.
     * This includes fetching both aggregation counts and county geometries.
     */
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedState) return;

            try {
                // Fetch county aggregations data
                const aggregationsResponse = await fetch(
                    "https://waterwelldepthmap.bren.ucsb.edu/api/county-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                // Prepare query parameters for fetching county geometries
                const queryParams = new URLSearchParams({
                    where: `STATE_NAME='${selectedState}'`,
                    outFields: "*",
                    outSR: "4326",
                    f: "geojson",
                });

                // Fetch county geometries from ArcGIS REST API
                const polygonsResponse = await fetch(
                    `https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0/query?${queryParams.toString()}`
                );
                const polygonsData = await polygonsResponse.json();

                // Process each county feature
                const combinedData: CountyFeature[] = polygonsData.features.map(
                    (feature: any) => {
                        const countyName = feature.properties.NAME;
                        const fullName = `${countyName}, ${selectedState}`;
                        const wellCount = aggregationsData[fullName] || 0;
                        const geometry = feature.geometry;

                        console.log("County geometry:", fullName);
                        const visualCenter =
                            calculateVisualCenterCallback(geometry);

                        return {
                            name: fullName,
                            geometry: geometry,
                            wellCount: wellCount,
                            visualCenter: visualCenter,
                        };
                    }
                );

                setCountyFeatures(combinedData);
            } catch (error) {
                console.error("Error fetching county data:", error);
            }
        };

        fetchData();
    }, [selectedState, calculateVisualCenterCallback]);

    /**
     * Adds event listeners for camera movement to show/hide county aggregations.
     * Counties are shown when the camera is between 50 miles and 1,000,000 meters.
     */
    useEffect(() => {
        const handleCameraChange = () => {
            if (!viewer?.scene) {
                return;
            }

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;
            const thresholdHeight = 1609.34 * 50; // 50 miles in meters

            const shouldShow =
                cameraHeight >= thresholdHeight && cameraHeight < 1_000_000;

            setShowCounties(shouldShow);
            setCameraPosition(cartographicPosition);
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
    }, [viewer, setCameraPosition]);

    /**
     * Converts GeoJSON geometry to PolygonHierarchy for Cesium rendering.
     * Cleans and rewinds the geometry before conversion.
     */
    const convertGeometry = useCallback(
        (geometry: Geometry): PolygonHierarchy[] | undefined => {
            // Wrap the geometry into a Feature
            let feature: GeoJSON.Feature<Geometry> = {
                type: "Feature",
                geometry: geometry,
                properties: {},
            };

            // Clean up the geometry
            feature = cleanCoords(feature) as GeoJSON.Feature<Geometry>;

            // Ensure correct winding order
            feature = rewind(feature, {
                reverse: true,
            }) as GeoJSON.Feature<Geometry>;

            const geom = feature.geometry;

            if (geom.type === "Polygon") {
                const positions = geom.coordinates[0].map(
                    (coords: Position) => {
                        const [lon, lat] = coords; // Ensure [lon, lat] order
                        return fromDegrees(lon, lat, raisedHeight);
                    }
                );

                const holes = geom.coordinates
                    .slice(1)
                    .map((hole: Position[]) => {
                        const holePositions = hole.map((coords: Position) => {
                            const [lon, lat] = coords;
                            return fromDegrees(lon, lat, raisedHeight);
                        });
                        return new PolygonHierarchy(holePositions);
                    });

                return [new PolygonHierarchy(positions, holes)];
            } else if (geom.type === "MultiPolygon") {
                const hierarchies: PolygonHierarchy[] = geom.coordinates.map(
                    (polygon: Position[][]) => {
                        const positions = polygon[0].map((coords: Position) => {
                            const [lon, lat] = coords;
                            return fromDegrees(lon, lat, raisedHeight);
                        });

                        const holes = polygon
                            .slice(1)
                            .map((hole: Position[]) => {
                                const holePositions = hole.map(
                                    (coords: Position) => {
                                        const [lon, lat] = coords;
                                        return fromDegrees(
                                            lon,
                                            lat,
                                            raisedHeight
                                        );
                                    }
                                );
                                return new PolygonHierarchy(holePositions);
                            });

                        return new PolygonHierarchy(positions, holes);
                    }
                );
                return hierarchies;
            }
            return undefined;
        },
        [raisedHeight]
    );

    /**
     * Memoizes the list of Entity components to prevent unnecessary re-renders.
     * Creates separate Entities for polygons and labels.
     */
    const entities = useMemo(() => {
        if (!showCounties || !selectedState || loading) return null;

        return countyFeatures.flatMap((feature) => {
            const hierarchies = convertGeometry(feature.geometry);
            if (!hierarchies) return [];

            return hierarchies.map((hierarchy, index) => {
                // Validate visual center coordinates before rendering
                if (
                    isNaN(feature.visualCenter.lat) ||
                    isNaN(feature.visualCenter.lon) ||
                    feature.visualCenter.lat == null ||
                    feature.visualCenter.lon == null
                ) {
                    console.warn(`Invalid visual center for ${feature.name}`);
                    return null;
                }

                // Convert visual center to Cartesian3
                const labelPosition = fromDegrees(
                    feature.visualCenter.lon,
                    feature.visualCenter.lat,
                    raisedHeight
                );

                const polygonPosition = labelPosition;

                // Calculate the color based on well count
                const polygonColor = getGradientColor(
                    feature.wellCount,
                    MIN_WELL_COUNT,
                    MAX_WELL_COUNT
                );

                return [
                    // Polygon Entity
                    <Entity
                        key={`polygon-${feature.name}-${index}`}
                        position={polygonPosition}
                    >
                        {/* Polygon Fill with Gradient Color */}
                        <PolygonGraphics
                            hierarchy={hierarchy}
                            material={polygonColor}
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
                                new NearFarScalar(1.0e4, 2.0, 5.0e6, 0.05)
                            }
                            eyeOffset={new Cartesian3(0.0, 0.0, -4000.0)} // Adjust as needed
                        />
                    </Entity>,
                ];
            });
        });
    }, [
        countyFeatures,
        showCounties,
        selectedState,
        loading,
        convertGeometry,
        raisedHeight,
        MIN_WELL_COUNT, // Added dependencies
        MAX_WELL_COUNT,
    ]);

    return <>{entities}</>;
};

export default React.memo(CountyAggregations);
