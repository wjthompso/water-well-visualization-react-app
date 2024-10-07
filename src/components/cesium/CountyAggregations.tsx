import pointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers"; // Import the point helper
import {
    Cartesian3,
    Math as CesiumMath,
    Color,
    HorizontalOrigin,
    LabelStyle,
    NearFarScalar,
    VerticalOrigin,
} from "cesium";
import React, { useEffect, useRef, useState } from "react";
import { Entity, GeoJsonDataSource } from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";

interface CountyAggregationsProps {
    viewer: any;
}

interface CountyFeature {
    name: string;
    geometry: any;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const CountyAggregations: React.FC<CountyAggregationsProps> = ({ viewer }) => {
    const { cameraPosition, setCameraPosition } = useCameraPosition(); // Track camera position
    const { statePolygons, loading } = useStatePolygons();
    const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
    const [showCounties, setShowCounties] = useState<boolean>(false);
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Ref to store the interval ID
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Centroid calculation based on the polygon area
    const calculateCentroid = (
        coordinates: any
    ): { lat: number; lon: number } => {
        let totalLon = 0;
        let totalLat = 0;
        let totalArea = 0;

        const isMultiPolygon = Array.isArray(coordinates[0][0][0]);
        const polygons = isMultiPolygon ? coordinates : [coordinates];

        polygons.forEach((polygon: any) => {
            polygon.forEach((ring: any, ringIndex: number) => {
                let area = 0;
                let centroidLon = 0;
                let centroidLat = 0;

                for (let i = 0; i < ring.length - 1; i++) {
                    const [lon1, lat1] = ring[i];
                    const [lon2, lat2] = ring[i + 1];

                    const partialArea = lon1 * lat2 - lon2 * lat1;
                    area += partialArea;
                    centroidLon += (lon1 + lon2) * partialArea;
                    centroidLat += (lat1 + lat2) * partialArea;
                }

                if (area !== 0) {
                    area = area / 2;
                    centroidLon = centroidLon / (6 * area);
                    centroidLat = centroidLat / (6 * area);

                    const weight = ringIndex === 0 ? 1 : -1;
                    totalLon += centroidLon * area * weight;
                    totalLat += centroidLat * area * weight;
                    totalArea += area * weight;
                }
            });
        });

        if (totalArea === 0) {
            return { lon: 0, lat: 0 };
        }

        return {
            lon: totalLon / totalArea,
            lat: totalLat / totalArea,
        };
    };

    // Fetch county polygons and aggregations
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedState) {
                return;
            }

            try {
                const aggregationsResponse = await fetch(
                    "http://localhost:3000/county-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                const queryParams = new URLSearchParams({
                    where: `STATE_NAME='${selectedState}'`,
                    outFields: "*",
                    outSR: "4326",
                    f: "geojson",
                });

                const polygonsResponse = await fetch(
                    `https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0/query?${queryParams.toString()}`
                );
                const polygonsData = await polygonsResponse.json();

                const combinedData: CountyFeature[] = polygonsData.features.map(
                    (feature: any) => {
                        const countyName = feature.properties.NAME;
                        const fullName = `${countyName}, ${selectedState}`;
                        const wellCount = aggregationsData[fullName] || 0;

                        const coordinates = feature.geometry.coordinates;
                        const centroid = calculateCentroid(coordinates);

                        return {
                            name: fullName,
                            geometry: feature.geometry,
                            wellCount,
                            centroid,
                        };
                    }
                );

                setCountyFeatures(combinedData);
            } catch (error) {
                console.error("Error fetching county data:", error);
            }
        };

        fetchData();
    }, [selectedState, viewer]);

    // Detect camera movement and update the camera position
    useEffect(() => {
        const handleCameraChange = () => {
            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition.height;
            const thresholdHeight = 1609.34 * 50;

            setShowCounties(
                cameraHeight >= thresholdHeight && cameraHeight < 2_000_000
            );

            // Update camera position context
            setCameraPosition(cartographicPosition);
        };

        const startInterval = () => {
            // If interval is already running, do nothing
            if (intervalRef.current !== null) return;

            // Start the interval
            intervalRef.current = setInterval(handleCameraChange, 300);
        };

        const stopInterval = () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // Call handleCameraChange one last time
            handleCameraChange();
        };

        // Add event listeners
        viewer.camera.moveStart.addEventListener(startInterval);
        viewer.camera.moveEnd.addEventListener(stopInterval);

        // Trigger handleCameraChange once on mount to set initial state
        handleCameraChange();

        return () => {
            // Remove event listeners
            viewer.camera.moveStart.removeEventListener(startInterval);
            viewer.camera.moveEnd.removeEventListener(stopInterval);

            // Clear any remaining interval
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [viewer, setCameraPosition]);

    // Detect what state the camera is in
    useEffect(() => {
        if (!cameraPosition || loading || statePolygons.length === 0) {
            return;
        }

        // Convert the latitude and longitude from radians to degrees
        const currentLat = CesiumMath.toDegrees(cameraPosition.latitude);
        const currentLon = CesiumMath.toDegrees(cameraPosition.longitude);

        // Create a Turf.js Point feature
        const pointFeature = point([currentLon, currentLat]);

        // Find the state that contains the point
        const state = statePolygons.find((state) => {
            const inside = pointInPolygon(pointFeature, state.geometry);
            return inside;
        });

        if (state) {
            setSelectedState(state.name);
        }
    }, [cameraPosition, statePolygons]);

    if (!showCounties || !selectedState) {
        return null;
    }

    return (
        <>
            <GeoJsonDataSource
                data={{
                    type: "FeatureCollection",
                    features: countyFeatures.map((feature) => ({
                        type: "Feature",
                        geometry: feature.geometry,
                        properties: {
                            name: feature.name,
                            wellCount: feature.wellCount,
                        },
                    })),
                }}
                stroke={Color.WHITE}
                fill={Color.TRANSPARENT}
                strokeWidth={0.5}
                clampToGround={false}
            />

            {countyFeatures.map((feature) => (
                <React.Fragment key={feature.name}>
                    <Entity
                        key={`circle-${feature.name}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat
                        )}
                        ellipse={{
                            semiMajorAxis: 10000,
                            semiMinorAxis: 10000,
                            material: Color.BLUE.withAlpha(0.5),
                            outline: true,
                            outlineColor: Color.WHITE,
                        }}
                    />

                    <Entity
                        key={`label-${feature.name}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat
                        )}
                        label={{
                            text: feature.wellCount.toLocaleString(),
                            font: "14pt sans-serif",
                            fillColor: Color.WHITE,
                            outlineColor: Color.BLACK,
                            outlineWidth: 1,
                            style: LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: VerticalOrigin.CENTER,
                            horizontalOrigin: HorizontalOrigin.CENTER,
                            pixelOffset: new Cartesian3(0, 0, 0),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scaleByDistance: new NearFarScalar(
                                1.0e4,
                                2.0,
                                5.0e6,
                                0.05
                            ),
                        }}
                    />
                </React.Fragment>
            ))}
        </>
    );
};

export default CountyAggregations;
