// src/context/CameraPositionContext.tsx
import { Cartographic } from "cesium";
import React, { createContext, useContext, useState } from "react";

interface CameraPositionContextProps {
    cameraPosition: Cartographic | null;
    setCameraPosition: (pos: Cartographic) => void;
}

const CameraPositionContext = createContext<CameraPositionContextProps>({
    cameraPosition: null,
    setCameraPosition: () => {},
});

export const useCameraPosition = () => useContext(CameraPositionContext);

export const CameraPositionProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [cameraPosition, setCameraPosition] = useState<Cartographic | null>(
        null
    );

    return (
        <CameraPositionContext.Provider
            value={{ cameraPosition, setCameraPosition }}
        >
            {children}
        </CameraPositionContext.Provider>
    );
};
