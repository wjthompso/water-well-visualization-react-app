import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import cesium from "vite-plugin-cesium";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";

const cesiumSource = "node_modules/cesium/Build/Cesium";
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = "cesiumStatic";

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        // Define relative base path in cesium for loading assets
        // https://vitejs.dev/config/shared-options.html#define
        CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
    },
    base: "/",
    plugins: [
        react(),
        // cesium(),
        svgr(),
        viteStaticCopy({
            targets: [
                { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
            ],
        }),
    ],
    server: {
        fs: {
            // Allow Vite's server to access files outside of the root directory
            strict: false,
        },
    },
});
