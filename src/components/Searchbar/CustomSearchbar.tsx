// CustomSearchBar.tsx
import { Cartesian3, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { debounce } from "lodash"; // Install lodash if not already installed
import React, { useEffect, useState } from "react";
import { CesiumComponentRef } from "resium";
import SearchIcon from "../../assets/SearchIcon.svg";
import "./CustomSearchbar.css";

interface CustomSearchBarProps {
    viewerRef: React.RefObject<CesiumComponentRef<CesiumViewer>>;
    searchBarRef: React.RefObject<HTMLDivElement>;
}

interface GeocodeResult {
    place_id: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
    viewerRef,
    searchBarRef,
}) => {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<GeocodeResult[]>([]);
    const [searchBarInFocus, setSearchBarInFocus] = useState<boolean>(false);

    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_APS_API_KEY;

    console.log("Google API key:", GOOGLE_API_KEY);

    const fetchGeocodingResults = async (searchQuery: string) => {
        if (searchQuery.trim() === "") return;

        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                    searchQuery
                )}&key=${GOOGLE_API_KEY}`
            );
            const data = await response.json();

            if (data.status === "OK") {
                setResults(data.results);
            } else {
                console.error("Error fetching geocoding results:", data.status);
            }
        } catch (error) {
            console.error("Error fetching geocoding results:", error);
        }
    };

    // Debounced search function
    const debouncedFetchGeocodingResults = debounce(fetchGeocodingResults, 500);

    useEffect(() => {
        debouncedFetchGeocodingResults(query);

        // Cleanup the debounce effect on unmount
        return () => {
            debouncedFetchGeocodingResults.cancel();
        };
    }, [query]);

    const handleResultClick = (result: GeocodeResult) => {
        const { lat, lng } = result.geometry.location;

        if (viewerRef.current && viewerRef.current.cesiumElement) {
            const viewer = viewerRef.current.cesiumElement as CesiumViewer;
            viewer.camera.flyTo({
                destination: Cartesian3.fromDegrees(lng, lat, 5000),
                orientation: {
                    heading: CesiumMath.toRadians(0),
                    pitch: CesiumMath.toRadians(-60),
                    roll: 0.0,
                },
            });

            setResults([]);
            setQuery(result.formatted_address);
        }
    };

    return (
        <div
            ref={searchBarRef}
            id="custom-search-bar-container"
            className="absolute z-30 w-full md:w-[17rem] md:right-[calc(19rem+0.5rem)] md:top-[0.4rem] px-2 py-1 bg-headerBackgroundColor border-b-[0.5px] md:border-none border-borderColor md:px-0 md:py-0 md:bg-transparent md:shadow-xl"
            onFocus={() => setSearchBarInFocus(true)}
            onBlur={() => setTimeout(() => setSearchBarInFocus(false), 300)}
        >
            <div
                id="custom-search-bar-with-results"
                className="min-h-[2rem] flex flex-col flex-1 px-[0.4rem] bg-headerBackgroundColor rounded-md border-[1px] border-[#9A9A9A]"
            >
                <div
                    id="search-bar"
                    className="flex flex-row h-[2.2rem]"
                >
                    <img
                        src={SearchIcon}
                        alt="Search Icon"
                        className="self-center w-4 h-4 mr-[0.3rem] custom-search-icon-svg-filter"
                    />
                    <input
                        id="search-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a city or address"
                        className="flex-1 flex-grow w-full h-full text-white outline-none bg-headerBackgroundColor focus:ring-0"
                    />
                </div>
                {searchBarInFocus && (
                    <ul
                        id="search-results"
                        className="w-full bg-headerBackgroundColor"
                    >
                        {results.map((result) => (
                            <li
                                key={result.place_id}
                                onClick={() => handleResultClick(result)}
                                className="flex items-center px-2 min-h-[2.2rem] text-white cursor-pointer hover:bg-gray-600 border-t-[1px] border-t-gray-200"
                            >
                                {result.formatted_address}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CustomSearchBar;
