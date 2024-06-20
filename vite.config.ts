import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";

// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    plugins: [react(), cesium()],
    server: {
        fs: {
            // Allow Vite's server to access files outside of the root directory
            strict: false,
        },
    },
});
