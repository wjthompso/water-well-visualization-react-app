// StateAggregationComponent.tsx

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
import { Geometry, Position } from "geojson";
import React, { useEffect, useRef, useState } from "react";
import { Entity } from "resium";
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
    const thresholdHeight = 1_000_000; // Adjust as needed
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const raisedHeight = 9000;

    const calculateCentroid = (
        geometry: Geometry
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
        geometry: Geometry
    ): PolygonHierarchy[] | undefined => {
        // Wrap the geometry into a Feature
        let feature: GeoJSON.Feature<Geometry> = {
            type: "Feature",
            geometry: geometry,
            properties: {},
        };

        // Simplify and clean up geometry (optional)
        // const simplifyTolerance = 0.001; // Adjust as needed
        // feature = simplify(feature, { tolerance: simplifyTolerance, highQuality: true }) as GeoJSON.Feature<Geometry>;

        // Clean up the geometry
        feature = cleanCoords(feature) as GeoJSON.Feature<Geometry>;

        // Ensure correct winding order for Cesium rendering
        feature = rewind(feature, {
            reverse: true,
        }) as GeoJSON.Feature<Geometry>;

        const geom = feature.geometry;

        if (geom.type === "Polygon") {
            const positions = geom.coordinates[0].map((coords: Position) => {
                const [lon, lat] = coords;
                return Cartesian3.fromDegrees(lon, lat, raisedHeight);
            });

            const holes = geom.coordinates.slice(1).map((hole: Position[]) => {
                const holePositions = hole.map((coords: Position) => {
                    const [lon, lat] = coords;
                    return Cartesian3.fromDegrees(lon, lat, raisedHeight);
                });
                return new PolygonHierarchy(holePositions);
            });

            return [new PolygonHierarchy(positions, holes)];
        } else if (geom.type === "MultiPolygon") {
            const hierarchies: PolygonHierarchy[] = geom.coordinates.map(
                (polygon: Position[][]) => {
                    const positions = polygon[0].map((coords: Position) => {
                        const [lon, lat] = coords;
                        return Cartesian3.fromDegrees(lon, lat, raisedHeight);
                    });

                    const holes = polygon.slice(1).map((hole: Position[]) => {
                        const holePositions = hole.map((coords: Position) => {
                            const [lon, lat] = coords;
                            return Cartesian3.fromDegrees(
                                lon,
                                lat,
                                raisedHeight
                            );
                        });
                        return new PolygonHierarchy(holePositions);
                    });

                    return new PolygonHierarchy(positions, holes);
                }
            );
            return hierarchies;
        }
        return undefined;
    };

    if (!showStates || loading) {
        return null;
    }

    return (
        <>
            {stateFeatures.map((feature) => {
                const hierarchies = convertGeometryToHierarchy(
                    feature.geometry
                );
                if (!hierarchies) {
                    return null;
                }
                return hierarchies.map((hierarchy, index) => (
                    <Entity
                        key={`${feature.name}-${index}`}
                        polygon={{
                            hierarchy: hierarchy,
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
                ));
            })}
        </>
    );
};

export default StateAggregations;
