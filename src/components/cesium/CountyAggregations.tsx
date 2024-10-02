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

interface CountyAggregationsProps {
    viewer: any; // Replace 'any' with the appropriate CesiumViewer type if available
}

interface CountyFeature {
    name: string; // e.g., "Cecil, Maryland"
    geometry: any;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const CountyAggregations: React.FC<CountyAggregationsProps> = ({ viewer }) => {
    const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
    const [showCounties, setShowCounties] = useState<boolean>(false);

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

    // Fetch county polygons and aggregation data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch county aggregations
                const aggregationsResponse = await fetch(
                    "http://localhost:3000/county-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                // Fetch county polygons (handle pagination)
                let allFeatures: any[] = [];
                let resultOffset = 0;
                const pageSize = 2000;
                let fetchedAll = false;

                while (!fetchedAll) {
                    const queryParams = new URLSearchParams({
                        where: `1=1`,
                        outFields: "*",
                        outSR: "4326",
                        f: "geojson",
                        resultOffset: resultOffset.toString(),
                        resultRecordCount: pageSize.toString(),
                    });

                    const polygonsResponse = await fetch(
                        `https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0/query?${queryParams.toString()}`
                    );
                    const polygonsData = await polygonsResponse.json();

                    if (polygonsData.features.length > 0) {
                        allFeatures = allFeatures.concat(polygonsData.features);
                        resultOffset += pageSize;
                    } else {
                        fetchedAll = true;
                    }
                }

                // Combine data
                const combinedData: CountyFeature[] = allFeatures.map(
                    (feature: any) => {
                        const countyName = feature.properties.NAME;
                        const stateName = feature.properties.STATE_NAME;
                        const fullName = `${countyName}, ${stateName}`;
                        const wellCount = aggregationsData[fullName] || 0;

                        // Calculate centroid
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
    }, []);

    // Handle camera zoom level to show/hide county polygons
    useEffect(() => {
        const handleCameraChange = () => {
            const cameraHeight = viewer.camera.positionCartographic.height;
            const thresholdHeight = 2000000; // Adjust as needed
            setShowCounties(cameraHeight <= thresholdHeight);
        };

        viewer.camera.changed.addEventListener(handleCameraChange);

        // Cleanup
        return () => {
            viewer.camera.changed.removeEventListener(handleCameraChange);
        };
    }, [viewer]);

    if (!showCounties) {
        return null;
    }

    return (
        <>
            {/* Render county polygons */}
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
                clampToGround={true}
            />

            {/* Render blue circles and labels */}
            {countyFeatures.map((feature) => (
                <React.Fragment key={feature.name}>
                    {/* Blue Circle */}
                    <Entity
                        key={`circle-${feature.name}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat
                        )}
                        ellipse={{
                            semiMajorAxis: 10000, // Adjust size as needed
                            semiMinorAxis: 10000, // Adjust size as needed
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
                            outlineWidth: 1,
                            style: LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: VerticalOrigin.CENTER,
                            horizontalOrigin: HorizontalOrigin.CENTER,
                            pixelOffset: new Cartesian3(0, 0, 0),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            // Dynamic scaling by distance
                            scaleByDistance: new NearFarScalar(
                                1.0e5,
                                2.0, // At 100,000 meters, scale by 2x
                                1.0e6,
                                0.1 // At 1,000,000 meters, scale by 0.1x
                            ),
                        }}
                    />
                </React.Fragment>
            ))}
        </>
    );
};

export default CountyAggregations;
