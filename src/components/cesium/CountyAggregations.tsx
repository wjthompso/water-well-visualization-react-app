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
import React, { useEffect, useRef, useState } from "react";
import { Entity } from "resium";
import { useCameraPosition } from "../../context/CameraPositionContext";
import { useStatePolygons } from "../../context/StatePolygonContext";

interface CountyAggregationsProps {
    viewer: CesiumViewer;
}

interface CountyFeature {
    name: string;
    geometry: Geometry;
    wellCount: number;
    centroid: { lat: number; lon: number };
}

const CountyAggregations: React.FC<CountyAggregationsProps> = ({ viewer }) => {
    console.log("Just entered CountyAggregations");

    const { cameraPosition, setCameraPosition } = useCameraPosition();
    const { statePolygons, loading } = useStatePolygons();
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [countyFeatures, setCountyFeatures] = useState<CountyFeature[]>([]);
    const [showCounties, setShowCounties] = useState<boolean>(false);
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

    // Sets the selected state based off the camera position. Runs when we
    // finish loading, when the state polygons change (load), or when the camera
    // position changes
    useEffect(() => {
        if (!cameraPosition || loading || statePolygons.length === 0) {
            console.log(
                "Instead of setting the selected state, returning null"
            );
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
    }, [cameraPosition, statePolygons, loading]);

    // Fetches county aggregation data when selected state changes
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

        console.log("Fetching data to set the selected state");
        fetchData();
    }, [selectedState]);

    // Adds event listeners for camera movement to show/hide county aggregations
    useEffect(() => {
        const handleCameraChange = () => {
            if (!viewer?.scene) {
                console.log("Perhaps we don't think the scene is ready?");
                return;
            }

            const cartographicPosition = viewer.camera.positionCartographic;
            const cameraHeight = cartographicPosition?.height || 0;
            const thresholdHeight = 1609.34 * 50;

            const shouldShow =
                cameraHeight >= thresholdHeight && cameraHeight < 1_000_000;

            console.log("Should show counties:", shouldShow);

            setShowCounties(shouldShow);
            setCameraPosition(cartographicPosition);
        };

        const startInterval = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(handleCameraChange, 100);
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            handleCameraChange();
        };

        console.log("Adding event listeners");
        viewer?.camera.moveStart.addEventListener(startInterval);
        viewer?.camera.moveEnd.addEventListener(stopInterval);

        return () => {
            console.log("Removing event listeners");
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

    if (!showCounties || !selectedState) {
        console.log("Returning null: showCounties", showCounties);
        console.log("Returning null: selectedState", selectedState);

        return null;
    }

    console.log("County features about to hit render function");

    return (
        <>
            {countyFeatures.map((feature) => {
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
                ));
            })}
        </>
    );
};

export default React.memo(CountyAggregations);
