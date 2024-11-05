// utils/geometryUtils.ts

import { Cartesian3, PolygonHierarchy } from "cesium";
import { Geometry } from "geojson";
import polylabel from "polylabel";

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
    if (geometry.type === "Polygon") {
        const positions = geometry.coordinates[0].map(([lon, lat]) =>
            Cartesian3.fromDegrees(lon, lat, raisedHeight)
        );

        const holes = geometry.coordinates.slice(1).map((hole) => {
            const holePositions = hole.map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat, raisedHeight)
            );
            return new PolygonHierarchy(holePositions);
        });

        return [new PolygonHierarchy(positions, holes)];
    } else if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.map((polygon) => {
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

/**
 * Converts GeoJSON geometry to an array of rings compatible with polylabel.
 * Flattens all rings for MultiPolygon geometries into a single array.
 *
 * @param geometry - The GeoJSON geometry.
 * @returns An array of rings for use with polylabel.
 */
export const convertGeoJSONToPolylabel = (geometry: Geometry): number[][][] => {
    if (geometry.type === "Polygon") {
        return geometry.coordinates.map((ring) =>
            ring.map(([lon, lat]) => [lon, lat])
        );
    } else if (geometry.type === "MultiPolygon") {
        const allRings: number[][][] = [];
        for (const polygon of geometry.coordinates) {
            for (const ring of polygon) {
                allRings.push(ring.map(([lon, lat]) => [lon, lat]));
            }
        }
        return allRings;
    } else {
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
};

/**
 * Calculates the visual center (pole of inaccessibility) of a polygon using polylabel.
 * Handles both Polygon and MultiPolygon geometries.
 * @param geometry - The GeoJSON geometry.
 * @param precision - The precision for polylabel (default is 1.0).
 * @returns The visual center as latitude and longitude.
 */
export const calculateVisualCenter = (
    geometry: Geometry,
    precision: number = 0.05
): { lat: number; lon: number } => {
    const polylabelInput = convertGeoJSONToPolylabel(geometry);

    const point = polylabel(polylabelInput, precision);

    if (!point) {
        throw new Error("Failed to calculate visual center");
    }

    const [lon, lat] = point;
    return { lat, lon };
};

/**
 * Converts latitude and longitude to Cartesian3 coordinates.
 * @param lon - Longitude in degrees.
 * @param lat - Latitude in degrees.
 * @param height - Height in meters.
 * @returns Cartesian3 coordinates.
 */
export const fromDegrees = (
    lon: number,
    lat: number,
    height: number
): Cartesian3 => {
    return Cartesian3.fromDegrees(lon, lat, height);
};
