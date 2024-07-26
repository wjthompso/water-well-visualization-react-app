import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    plugins: [react(), cesium(), svgr()],
    server: {
        fs: {
            // Allow Vite's server to access files outside of the root directory
            strict: false,
        },
    },
});
