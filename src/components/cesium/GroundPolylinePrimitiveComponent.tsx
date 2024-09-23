// GroundPolylinePrimitiveComponent.tsx
import {
    Cartesian3,
    GroundPolylinePrimitive as CesiumGroundPolylinePrimitive,
    Color,
    ColorGeometryInstanceAttribute,
    GeometryInstance,
    GroundPolylineGeometry,
    GroundPolylinePrimitive,
    PolylineColorAppearance,
} from "cesium";
import React, { useEffect } from "react";
import { useCesium } from "resium";

interface Props {
    positions: Cartesian3[];
    width?: number;
    color?: Color;
}

const GroundPolylinePrimitiveComponent: React.FC<Props> = ({
    positions,
    width = 2.0,
    color = Color.WHITE,
}) => {
    const { scene } = useCesium();

    useEffect(() => {
        if (!scene) return;

        let groundPolylinePrimitive: CesiumGroundPolylinePrimitive | undefined;
        let isMounted = true;

        GroundPolylinePrimitive.initializeTerrainHeights().then(() => {
            if (!isMounted) return;

            groundPolylinePrimitive = new CesiumGroundPolylinePrimitive({
                geometryInstances: new GeometryInstance({
                    geometry: new GroundPolylineGeometry({
                        positions: positions,
                        width: width,
                    }),
                    attributes: {
                        color: ColorGeometryInstanceAttribute.fromColor(color),
                    },
                }),
                appearance: new PolylineColorAppearance(),
                asynchronous: false,
            });

            scene.groundPrimitives.add(groundPolylinePrimitive);
        });

        // Cleanup function to remove the primitive when the component unmounts or dependencies change
        return () => {
            isMounted = false;
            if (groundPolylinePrimitive) {
                scene.groundPrimitives.remove(groundPolylinePrimitive);
                if (!groundPolylinePrimitive.isDestroyed()) {
                    groundPolylinePrimitive.destroy();
                }
            }
        };
    }, [scene, positions, width, color]);

    return null;
};

export default GroundPolylinePrimitiveComponent;