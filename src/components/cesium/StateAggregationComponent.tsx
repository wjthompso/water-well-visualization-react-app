// StateAggregationComponent.tsx

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
import React, { useEffect, useRef, useState } from "react";
import { Entity } from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";

interface StateAggregationsProps {
    viewer: CesiumViewer; // Assuming CesiumViewer is correctly imported or defined
}

interface StateFeature {
    name: string;
    geometry: any;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const StateAggregations: React.FC<StateAggregationsProps> = ({ viewer }) => {
    const [stateFeatures, setStateFeatures] = useState<StateFeature[]>([]);
    const [showStates, setShowStates] = useState<boolean>(false);
    const { cameraPosition, setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const thresholdHeight = 1_000_000; // Adjust as needed
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
            try {
                const aggregationsResponse = await fetch(
                    "http://localhost:3000/state-aggregations"
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
            if (!viewer?.scene) return;

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;
            setShowStates(cameraHeight > thresholdHeight);
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

    if (!showStates || loading) {
        return null;
    }

    // viewer.scene.postProcessStages.fxaa.enabled = true;

    return (
        <>
            {stateFeatures.map((feature) => {
                const hierarchy = convertGeometryToHierarchy(feature.geometry);
                return (
                    <Entity
                        key={feature.name}
                        polygon={{
                            hierarchy,
                            height: raisedHeight,
                            material: Color.BLUE,
                            outline: true,
                            outlineColor: Color.WHITE,
                            outlineWidth: 4,
                        }}
                        label={{
                            text: feature.wellCount.toLocaleString(),
                            font: "15pt sans-serif",
                            fillColor: Color.WHITE,
                            // showBackground: true,
                            // backgroundColor: Color.BLACK.withAlpha(0.6),
                            outlineColor: Color.BLACK,
                            outlineWidth: 2,
                            style: LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: VerticalOrigin.CENTER,
                            horizontalOrigin: HorizontalOrigin.CENTER,
                            pixelOffset: new Cartesian3(0, 0, 0),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scaleByDistance: new NearFarScalar(
                                5.0e5,
                                1.5,
                                5.0e6,
                                0.75
                            ),
                            eyeOffset: new Cartesian3(0.0, 0.0, -4000.0), // Adjust this value as needed
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

export default StateAggregations;
