import pointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
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
import { Entity } from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";
import GroundPolylinePrimitiveComponent from "./GroundPolylinePrimitiveComponent"; // Import the polyline component
import GroundFilledPolygonComponent from "./GroundPrimitive";

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
    const { cameraPosition, setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
    const [showCounties, setShowCounties] = useState<boolean>(false);
    const [selectedState, setSelectedState] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const extractPolylines = (geometry: any): Cartesian3[][] => {
        if (geometry.type === "Polygon") {
            return geometry.coordinates.map((ring: any[]) =>
                ring.map(([lon, lat]) => Cartesian3.fromDegrees(lon, lat))
            );
        } else if (geometry.type === "MultiPolygon") {
            return geometry.coordinates.flatMap((polygon: any[]) =>
                polygon.map((ring: any[]) =>
                    ring.map(([lon, lat]) => Cartesian3.fromDegrees(lon, lat))
                )
            );
        }
        return [];
    };

    const extractPolygons = (geometry: any): Cartesian3[] => {
        const positions: Cartesian3[] = [];
        if (geometry.type === "Polygon") {
            geometry.coordinates[0].forEach(([lon, lat]: [number, number]) => {
                positions.push(Cartesian3.fromDegrees(lon, lat));
            });
        } else if (geometry.type === "MultiPolygon") {
            geometry.coordinates.forEach((polygon: any) => {
                polygon[0].forEach(([lon, lat]: [number, number]) => {
                    positions.push(Cartesian3.fromDegrees(lon, lat));
                });
            });
        }
        return positions;
    };

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

    useEffect(() => {
        const handleCameraChange = () => {
            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition.height;
            const thresholdHeight = 1609.34 * 50;

            const shouldShow =
                cameraHeight >= thresholdHeight && cameraHeight < 2_000_000;

            setShowCounties(shouldShow);
            setCameraPosition(cartographicPosition);
        };

        const startInterval = () => {
            if (intervalRef.current !== null) return;
            intervalRef.current = setInterval(handleCameraChange, 300);
        };

        const stopInterval = () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            handleCameraChange();
        };

        viewer.camera.moveStart.addEventListener(startInterval);
        viewer.camera.moveEnd.addEventListener(stopInterval);

        handleCameraChange();

        return () => {
            viewer.camera.moveStart.removeEventListener(startInterval);
            viewer.camera.moveEnd.removeEventListener(stopInterval);
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [viewer, setCameraPosition]);

    useEffect(() => {
        if (!cameraPosition || loading || statePolygons.length === 0) {
            return;
        }

        const currentLat = CesiumMath.toDegrees(cameraPosition.latitude);
        const currentLon = CesiumMath.toDegrees(cameraPosition.longitude);

        const pointFeature = point([currentLon, currentLat]);

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
            {countyFeatures.map((feature, index) => {
                const positions = extractPolygons(feature.geometry);
                const polylines = extractPolylines(feature.geometry);

                return (
                    <React.Fragment key={index}>
                        <GroundFilledPolygonComponent
                            positions={positions}
                            color={Color.BLUE.withAlpha(0.7)}
                        />
                        {polylines.map((outlinePositions, outlineIndex) => (
                            <GroundPolylinePrimitiveComponent
                                key={`${index}-outline-${outlineIndex}`}
                                positions={outlinePositions}
                                width={2.0}
                                color={Color.WHITE}
                            />
                        ))}
                    </React.Fragment>
                );
            })}

            {countyFeatures.map((feature) => (
                <React.Fragment key={feature.name}>
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
                                0.025
                            ),
                            backgroundColor: Color.BLUE.withAlpha(0.8),
                            backgroundPadding: new Cartesian3(7, 4),
                        }}
                    />
                </React.Fragment>
            ))}
        </>
    );
};

export default CountyAggregations;
