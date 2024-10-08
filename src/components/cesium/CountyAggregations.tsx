import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import centerOfMass from "@turf/center";
import { point } from "@turf/helpers";
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
import React, { useEffect, useRef, useState } from "react";
import { Entity } from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";

interface CountyAggregationsProps {
    viewer: CesiumViewer;
}

interface CountyFeature {
    name: string;
    geometry: GeoJSON.Geometry;
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
    const raisedHeight = 9000;

    const calculateCentroid = (
        geometry: GeoJSON.Geometry
    ): { lat: number; lon: number } => {
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
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedState) return;

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

                        const geometry = feature.geometry;
                        const centroid = calculateCentroid(geometry);

                        return {
                            name: fullName,
                            geometry: geometry,
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
    }, [selectedState]);

    useEffect(() => {
        const handleCameraChange = () => {
            if (!viewer?.scene) return;

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;
            const thresholdHeight = 1609.34 * 50;

            const shouldShow =
                cameraHeight >= thresholdHeight && cameraHeight < 1_000_000;

            setShowCounties(shouldShow);
            setCameraPosition(cartographicPosition);
        };

        const startInterval = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(handleCameraChange, 300);
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

        return () => {
            viewer?.camera.moveStart.removeEventListener(startInterval);
            viewer?.camera.moveEnd.removeEventListener(stopInterval);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [viewer, setCameraPosition]);

    useEffect(() => {
        if (!cameraPosition || loading || statePolygons.length === 0) return;

        const currentLat = CesiumMath.toDegrees(cameraPosition.latitude);
        const currentLon = CesiumMath.toDegrees(cameraPosition.longitude);
        const pointFeature = point([currentLon, currentLat]);

        const state = statePolygons.find((state) =>
            booleanPointInPolygon(pointFeature, state.geometry)
        );

        setSelectedState(state ? state.name : null);
    }, [cameraPosition, statePolygons, loading]);

    if (!showCounties || !selectedState) return null;

    const convertGeometryToHierarchy = (
        geometry: GeoJSON.Geometry
    ): PolygonHierarchy | undefined => {
        if (geometry.type === "Polygon") {
            const positions = geometry.coordinates[0].map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat, raisedHeight)
            );
            return new PolygonHierarchy(positions);
        } else if (geometry.type === "MultiPolygon") {
            const hierarchy = geometry.coordinates.map((polygon) => {
                const positions = polygon[0].map(([lon, lat]) =>
                    Cartesian3.fromDegrees(lon, lat, raisedHeight)
                );
                const holes = polygon
                    .slice(1)
                    .map((hole) =>
                        hole.map(([lon, lat]) =>
                            Cartesian3.fromDegrees(lon, lat, raisedHeight)
                        )
                    );
                return new PolygonHierarchy(
                    positions,
                    holes.map((h) => new PolygonHierarchy(h))
                );
            });
            return hierarchy.length > 0 ? hierarchy[0] : undefined;
        }
        return undefined;
    };

    return (
        <>
            {countyFeatures.map((feature) => {
                const hierarchy = convertGeometryToHierarchy(feature.geometry);
                return (
                    <Entity
                        key={feature.name}
                        polygon={{
                            hierarchy,
                            height: raisedHeight,
                            material: Color.BLUE.withAlpha(0.5),
                            outline: true,
                            outlineColor: Color.WHITE,
                            outlineWidth: 2,
                        }}
                        label={{
                            text: feature.wellCount.toLocaleString(),
                            font: "15pt sans-serif",
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
                            backgroundColor: Color.BLUE.withAlpha(0.8),
                            backgroundPadding: new Cartesian3(7, 4),
                        }}
                        position={Cartesian3.fromDegrees(
                            feature.centroid.lon,
                            feature.centroid.lat,
                            raisedHeight
                        )}
                    />
                );
            })}
        </>
    );
};

export default CountyAggregations;
