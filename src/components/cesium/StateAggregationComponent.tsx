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
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";

interface StateAggregationsProps {
    viewer: any;
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
    const { cameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const aggregationsResponse = await fetch(
                    "http://localhost:3000/state-aggregations"
                );
                const aggregationsData = await aggregationsResponse.json();

                const combinedData: StateFeature[] = statePolygons.map(
                    (feature) => {
                        const wellCount = aggregationsData[feature.name] || 0;
                        const centroid = calculateCentroid(
                            feature.geometry.coordinates
                        );

                        return {
                            name: feature.name,
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

        if (!loading) {
            fetchData();
        }
    }, [statePolygons, loading]);

    useEffect(() => {
        const handleCameraChange = () => {
            const cameraHeight = viewer.camera.positionCartographic.height;
            const thresholdHeight = 2000000;
            setShowStates(cameraHeight > thresholdHeight);
        };

        viewer.camera.changed.addEventListener(handleCameraChange);
        return () => {
            viewer.camera.changed.removeEventListener(handleCameraChange);
        };
    }, [viewer]);

    if (!showStates || loading) {
        return null;
    }

    return (
        <>
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

            {stateFeatures.map((feature) => (
                <React.Fragment key={feature.name}>
                    <Entity
                        key={`circle-${feature.name}`}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat
                        )}
                        ellipse={{
                            semiMajorAxis: 80000,
                            semiMinorAxis: 80000,
                            material: Color.BLUE.withAlpha(0.7),
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
                            font: "13pt sans-serif",
                            fillColor: Color.WHITE,
                            outlineColor: Color.BLACK,
                            outlineWidth: 2,
                            style: LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: VerticalOrigin.CENTER,
                            horizontalOrigin: HorizontalOrigin.CENTER,
                            pixelOffset: new Cartesian3(0, 0, 0),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scaleByDistance: new NearFarScalar(
                                1.0e6,
                                2.0,
                                1.0e7,
                                0.1
                            ),
                        }}
                    />
                </React.Fragment>
            ))}
        </>
    );
};

export default StateAggregations;
