// CustomSearchBar.tsx
import { Cartesian3, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { debounce } from "lodash"; // Install lodash if not already installed
import React, { useEffect, useState } from "react";
import { CesiumComponentRef } from "resium";
import SearchIcon from "../../assets/SearchIcon.svg";

interface CustomSearchBarProps {
    viewerRef: React.RefObject<CesiumComponentRef<CesiumViewer>>;
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

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ viewerRef }) => {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<GeocodeResult[]>([]);
    const [searchBarInFocus, setSearchBarInFocus] = useState<boolean>(false);

    const fetchGeocodingResults = async (searchQuery: string) => {
        if (searchQuery.trim() === "") return;

        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                    searchQuery
                )}&key=AIzaSyC7z0q-r21RaBwnhNFe1aegUwC_xpgYi4Y`
            );
            const data = await response.json();

            if (data.status === "OK") {
                console.log("Geocoding results:", data.results);
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
            id="custom-search-bar-container"
            className="absolute z-30 w-full md:w-[17rem] md:right-[calc(271px+1rem)] md:top-[1rem] px-2 py-1 bg-white md:px-0 md:py-0 md:bg-transparent"
            onFocus={() => setSearchBarInFocus(true)}
            onBlur={() => setSearchBarInFocus(false)}
        >
            <div
                id="custom-search-bar-with-results"
                className="min-h-[2rem] flex flex-col flex-1 px-[0.4rem] bg-white rounded-md border-[1px] border-[#9A9A9A]"
            >
                <div
                    id="search-bar"
                    className="flex flex-row h-[2.2rem]"
                >
                    <img
                        src={SearchIcon}
                        alt="Search Icon"
                        className="self-center w-4 h-4 mr-[0.3rem]"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a city or address..."
                        className="flex-1 flex-grow w-full h-full text-[#595959] outline-none focus:ring-0"
                    />
                </div>
                {searchBarInFocus && (
                    <ul
                        id="search-results"
                        className="w-full bg-white"
                    >
                        {results.map((result) => (
                            <li
                                key={result.place_id}
                                onClick={() => handleResultClick(result)}
                                className="flex items-center px-2 min-h-[2.2rem] cursor-pointer hover:bg-gray-200 border-t-[1px] border-t-gray-200"
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
