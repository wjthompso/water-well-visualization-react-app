import {
    Cartesian3,
    Color,
    HorizontalOrigin,
    LabelStyle,
    NearFarScalar,
    VerticalOrigin,
} from "cesium";
import React, { useEffect, useState } from "react";
import { Entity, GeoJsonDataSource } from "resium";

interface StateAggregationsProps {
    viewer: any; // Change 'any' to the appropriate CesiumViewer type if available
}

interface StateFeature {
    name: string;
    geometry: any;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const StateAggregations: React.FC<StateAggregationsProps> = ({ viewer }) => {
    const [stateFeatures, setStateFeatures] = useState<StateFeature[]>([]);
    const [showStates, setShowStates] = useState<boolean>(true);

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
            // 'polygon' is an array of rings (the first is outer boundary, others are holes)
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

                    // For holes (interior rings), subtract their contribution
                    const weight = ringIndex === 0 ? 1 : -1; // Outer ring vs. hole
                    totalLon += centroidLon * area * weight;
                    totalLat += centroidLat * area * weight;
                    totalArea += area * weight;
                }
            });
        });

        if (totalArea === 0) {
            // Prevent division by zero
            console.error("Total area is zero during centroid calculation.");
            return { lon: 0, lat: 0 };
        }

        return {
            lon: totalLon / totalArea,
            lat: totalLat / totalArea,
        };
    };

    // Fetch state polygons and aggregation data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch state polygons
                const polygonsResponse = await fetch(
                    "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"
                );
                const polygonsData = await polygonsResponse.json();

                // Fetch state aggregations
                const aggregationsResponse = await fetch(
                    "http://localhost:3000/state-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                // Combine data
                const combinedData: StateFeature[] = polygonsData.features.map(
                    (feature: any) => {
                        const stateName = feature.properties.STATE_NAME;
                        const wellCount = aggregationsData[stateName] || 0;

                        // Calculate centroid
                        const coordinates = feature.geometry.coordinates;
                        const centroid = calculateCentroid(coordinates);

                        return {
                            name: stateName,
                            geometry: feature.geometry,
                            wellCount,
                            centroid,
                        };
                    }
                );

                setStateFeatures(combinedData);
            } catch (error) {
                console.error("Error fetching state data:", error);
            }
        };

        fetchData();
    }, []);

    // Handle camera zoom level to show/hide state polygons
    useEffect(() => {
        const handleCameraChange = () => {
            const cameraHeight = viewer.camera.positionCartographic.height;
            const thresholdHeight = 2000000; // Adjust as needed
            setShowStates(cameraHeight > thresholdHeight);
        };

        viewer.camera.changed.addEventListener(handleCameraChange);

        // Cleanup
        return () => {
            viewer.camera.changed.removeEventListener(handleCameraChange);
        };
    }, [viewer]);

    if (!showStates) {
        return null;
    }

    return (
        <>
            {/* Render state polygons */}
            <GeoJsonDataSource
                data={{
                    type: "FeatureCollection",
                    features: stateFeatures.map((feature) => ({
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
                strokeWidth={1}
                clampToGround={true}
            />

            {/* Render blue circles and labels */}
            {stateFeatures.map((feature) => (
                <React.Fragment key={feature.name}>
                    {/* Blue Circle */}
                    <Entity
                        key={`circle-${feature.name}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat
                        )}
                        ellipse={{
                            semiMajorAxis: 80000, // Adjust size as needed
                            semiMinorAxis: 80000, // Adjust size as needed
                            material: Color.BLUE.withAlpha(0.5),
                            outline: true,
                            outlineColor: Color.WHITE,
                        }}
                    />

                    {/* Label/Text inside the circle */}
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
                            outlineWidth: 2,
                            style: LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: VerticalOrigin.CENTER,
                            horizontalOrigin: HorizontalOrigin.CENTER,
                            pixelOffset: new Cartesian3(0, 0, 0),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            // Dynamic scaling by distance
                            scaleByDistance: new NearFarScalar(
                                1.0e6,
                                2.0, // At 1,000,000 meters, scale by 2x
                                1.0e7,
                                0.3 // At 10,000,000 meters, scale by 0.5x
                            ),
                        }}
                    />
                </React.Fragment>
            ))}
        </>
    );
};

export default StateAggregations;
