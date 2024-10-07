import {
    Cartesian3,
    GroundPrimitive as CesiumGroundPrimitive,
    Color,
    ColorGeometryInstanceAttribute,
    GeometryInstance,
    GroundPrimitive,
    PerInstanceColorAppearance,
    PolygonGeometry,
} from "cesium";
import React, { useEffect } from "react";
import { useCesium } from "resium";

interface Props {
    positions: Cartesian3[];
    color?: Color;
}

const GroundFilledPolygonComponent: React.FC<Props> = ({
    positions,
    color = Color.BLUE.withAlpha(0.5), // Default color with semi-transparency
}) => {
    const { scene } = useCesium();

    useEffect(() => {
        if (!scene) return;

        let groundPolygonPrimitive: CesiumGroundPrimitive | undefined;
        let isMounted = true;

        GroundPrimitive.initializeTerrainHeights().then(() => {
            if (!isMounted) return;

            groundPolygonPrimitive = new CesiumGroundPrimitive({
                geometryInstances: new GeometryInstance({
                    geometry: new PolygonGeometry({
                        polygonHierarchy: {
                            positions: positions,
                            holes: [],
                        },
                        perPositionHeight: false, // Drape over terrain
                        height: 0,
                    }),
                    attributes: {
                        color: ColorGeometryInstanceAttribute.fromColor(color),
                    },
                }),
                appearance: new PerInstanceColorAppearance(),
                asynchronous: false,
            });

            scene.groundPrimitives.add(groundPolygonPrimitive);
        });

        return () => {
            isMounted = false;
            if (groundPolygonPrimitive) {
                scene.groundPrimitives.remove(groundPolygonPrimitive);
                if (!groundPolygonPrimitive.isDestroyed()) {
                    groundPolygonPrimitive.destroy();
                }
            }
        };
    }, [scene, positions, color]);

    return null;
};

export default GroundFilledPolygonComponent;
