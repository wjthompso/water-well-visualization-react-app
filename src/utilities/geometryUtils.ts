// utils/geometryUtils.ts

import cleanCoords from "@turf/clean-coords";
import rewind from "@turf/rewind";
import { Cartesian3, PolygonHierarchy } from "cesium";
import { Geometry } from "geojson";

/**
 * Converts GeoJSON Geometry to Cesium's PolygonHierarchy.
 * Handles both Polygon and MultiPolygon types, including Polygons with multiple outer rings.
 *
 * @param geometry - The GeoJSON geometry to convert.
 * @param raisedHeight - The height offset for the polygon.
 * @returns An array of PolygonHierarchy objects or undefined.
 */
export const convertGeometryToHierarchy = (
    geometry: Geometry,
    raisedHeight: number
): PolygonHierarchy[] | undefined => {
    let feature: GeoJSON.Feature<Geometry> = {
        type: "Feature",
        geometry,
        properties: {},
    };

    // Clean the geometry
    feature = cleanCoords(feature) as GeoJSON.Feature<Geometry>;

    // Rewind the geometry to ensure correct winding order
    feature = rewind(feature, { reverse: false }) as GeoJSON.Feature<Geometry>;

    const geom = feature.geometry;

    if (geom.type === "Polygon") {
        // Check if the Polygon has multiple outer rings (improperly represented)
        if (geom.coordinates.length > 1) {
            // Convert to MultiPolygon by nesting each ring as a separate polygon
            return geom.coordinates.map((ring) => {
                const positions = ring.map(([lon, lat]) =>
                    Cartesian3.fromDegrees(lon, lat, raisedHeight)
                );
                // Assuming no holes; if holes exist, additional handling is needed
                return new PolygonHierarchy(positions, []);
            });
        }

        // Single Polygon with potential holes
        const positions = geom.coordinates[0].map(([lon, lat]) =>
            Cartesian3.fromDegrees(lon, lat, raisedHeight)
        );

        const holes = geom.coordinates.slice(1).map((hole) => {
            const holePositions = hole.map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat, raisedHeight)
            );
            return new PolygonHierarchy(holePositions);
        });

        return [new PolygonHierarchy(positions, holes)];
    } else if (geom.type === "MultiPolygon") {
        // Proper MultiPolygon handling
        return geom.coordinates.map((polygon) => {
            const positions = polygon[0].map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat, raisedHeight)
            );

            const holes = polygon.slice(1).map((hole) => {
                const holePositions = hole.map(([lon, lat]) =>
                    Cartesian3.fromDegrees(lon, lat, raisedHeight)
                );
                return new PolygonHierarchy(holePositions);
            });

            return new PolygonHierarchy(positions, holes);
        });
    }

    // Return undefined for unsupported geometry types
    return undefined;
};

/**
 * Fixes a Polygon geometry by converting it to a MultiPolygon if it has multiple outer rings.
 *
 * @param geometry - The GeoJSON geometry to fix.
 * @returns The fixed GeoJSON geometry.
 */
export const fixPolygonToMultiPolygon = (geometry: Geometry): Geometry => {
    if (geometry.type === "Polygon" && geometry.coordinates.length > 1) {
        return {
            type: "MultiPolygon",
            coordinates: geometry.coordinates.map((ring) => [ring]),
        };
    }
    return geometry;
};
