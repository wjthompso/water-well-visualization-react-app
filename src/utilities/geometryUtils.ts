// utils/geometryUtils.ts

import cleanCoords from "@turf/clean-coords";
import rewind from "@turf/rewind";
import { Cartesian3, PolygonHierarchy } from "cesium";
import { Geometry, MultiPolygon, Polygon } from "geojson";
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

export const convertGeoJSONToPolylabel = (
    geometry: Geometry
): number[][][][] | number[][][] | number[][] => {
    if (geometry.type === "Polygon") {
        // Each Polygon has an array of Linear Rings
        // The first ring is the outer boundary, subsequent rings are holes
        // polylabel expects an array of rings, each ring being an array of [x, y]
        return (geometry as Polygon).coordinates.map((ring) =>
            ring.map((coord) => [coord[0], coord[1]])
        );
    } else if (geometry.type === "MultiPolygon") {
        // For MultiPolygon, return an array of polygons
        return (geometry as MultiPolygon).coordinates.map((polygon) =>
            polygon.map((ring) => ring.map((coord) => [coord[0], coord[1]]))
        );
    }
    // Handle other geometry types if necessary
    throw new Error(`Unsupported geometry type: ${geometry.type}`);
};

/**
 * Calculates the visual center (pole of inaccessibility) of a polygon using polylabel.
 * @param geometry - The GeoJSON geometry.
 * @param precision - The precision for polylabel (default is 1.0).
 * @returns The visual center as latitude and longitude.
 */
export const calculateVisualCenter = (
    geometry: Geometry,
    precision: number = 1.0
): { lat: number; lon: number } => {
    const polylabelInput = convertGeoJSONToPolylabel(geometry);

    let point: number[] | null = null;

    if (Array.isArray((polylabelInput as number[][][])[0][0][0])) {
        // MultiPolygon: Calculate visual center for the first polygon
        // You might want to enhance this to choose the most appropriate polygon
        point = polylabel(polylabelInput[0] as number[][][], precision);
    } else {
        // Single Polygon
        point = polylabel(polylabelInput as number[][][], precision);
    }

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
