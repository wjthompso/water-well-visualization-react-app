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
import {
    CustomDataSource,
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
    const thresholdHeight = 1_000_000; // Adjusted to a more reasonable value
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
            const shouldShow = cameraHeight >= thresholdHeight;
            console.log("shouldShow", shouldShow);
            setShowStates(shouldShow);
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
        <CustomDataSource name="StateAggregationsDataSource">
            {stateFeatures.map((feature) => {
                const hierarchies = convertGeometryToHierarchy(
                    feature.geometry
                );
                if (!hierarchies) {
                    return null;
                }

                return hierarchies.map((hierarchy, index) => {
                    // Extract polygon positions for PolylineGraphics
                    const polygonPositions = hierarchy.positions;

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
                                // Removed outline properties
                            />
                            {/* Polygon Outline */}
                            <PolylineGraphics
                                positions={polygonPositions}
                                width={2} // Adjust this value for thicker outlines
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
                                disableDepthTestDistance={
                                    Number.POSITIVE_INFINITY
                                }
                                scaleByDistance={
                                    new NearFarScalar(5.0e5, 1.5, 5.0e6, 0.75)
                                }
                                eyeOffset={new Cartesian3(0.0, 0.0, -4000.0)} // Adjust this value as needed
                            />
                        </Entity>
                    );
                });
            })}
        </CustomDataSource>
    );
};

export default StateAggregations;
