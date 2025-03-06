// src/context/StatePolygonContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

interface StatePolygon {
    name: string;
    geometry: any;
}

interface StatePolygonContextProps {
    statePolygons: StatePolygon[];
    loading: boolean;
    error: any;
}

const StatePolygonContext = createContext<StatePolygonContextProps>({
    statePolygons: [],
    loading: false,
    error: null,
});

export const useStatePolygons = () => useContext(StatePolygonContext);

export const StatePolygonProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [statePolygons, setStatePolygons] = useState<StatePolygon[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchStatePolygons = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"
                );
                const data = await response.json();
                const states = data.features.map((feature: any) => ({
                    name: feature.properties.STATE_NAME,
                    geometry: feature.geometry,
                }));
                setStatePolygons(states);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatePolygons();
    }, []);

    return (
        <StatePolygonContext.Provider value={{ statePolygons, loading, error }}>
            {children}
        </StatePolygonContext.Provider>
    );
};

export default StatePolygonContext;
