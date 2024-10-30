// StatePolylinesPrimitive.tsx

import {
    Viewer as CesiumViewer,
    GeometryInstance,
    PolylineColorAppearance,
    Primitive,
} from "cesium";
import React, { useEffect, useRef } from "react";

interface StatePolylinesPrimitiveProps {
    viewer: CesiumViewer;
    polylineInstances: GeometryInstance[];
}

const StatePolylinesPrimitive: React.FC<StatePolylinesPrimitiveProps> = ({
    viewer,
    polylineInstances,
}) => {
    const primitiveRef = useRef<Primitive | null>(null);

    useEffect(() => {
        if (!viewer || polylineInstances.length === 0) return;

        const polylinePrimitive = new Primitive({
            geometryInstances: polylineInstances,
            appearance: new PolylineColorAppearance({
                translucent: true,
                // flat: true,
            }),
            releaseGeometryInstances: false,
            asynchronous: false,
        });
        viewer.scene.primitives.add(polylinePrimitive);
        primitiveRef.current = polylinePrimitive;

        return () => {
            if (primitiveRef.current) {
                viewer.scene.primitives.remove(primitiveRef.current);
                primitiveRef.current = null;
            }
        };
    }, [viewer, polylineInstances]);

    return null;
};

export default StatePolylinesPrimitive;
