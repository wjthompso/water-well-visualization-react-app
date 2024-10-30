// StatePolygonsPrimitive.tsx

import {
    Viewer as CesiumViewer,
    GeometryInstance,
    PerInstanceColorAppearance,
    Primitive,
} from "cesium";
import React, { useEffect, useRef } from "react";

interface StatePolygonsPrimitiveProps {
    viewer: CesiumViewer;
    polygonInstances: GeometryInstance[];
}

const StatePolygonsPrimitive: React.FC<StatePolygonsPrimitiveProps> = ({
    viewer,
    polygonInstances,
}) => {
    const primitiveRef = useRef<Primitive | null>(null);

    useEffect(() => {
        if (!viewer || polygonInstances.length === 0) return;

        const polygonPrimitive = new Primitive({
            geometryInstances: polygonInstances,
            appearance: new PerInstanceColorAppearance({
                translucent: true,
                flat: true,
            }),
            releaseGeometryInstances: false,
            asynchronous: false,
        });
        viewer.scene.primitives.add(polygonPrimitive);
        primitiveRef.current = polygonPrimitive;

        return () => {
            if (primitiveRef.current) {
                viewer.scene.primitives.remove(primitiveRef.current);
                primitiveRef.current = null;
            }
        };
    }, [viewer, polygonInstances]);

    return null;
};

export default StatePolygonsPrimitive;
