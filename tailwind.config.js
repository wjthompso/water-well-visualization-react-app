/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            height: {
                "full-cesium-height": "calc(var(--vh) * 100 - 3.5rem)",
                "mobile-cesium-height": "calc(var(--vh) * 100 - 89px)",
            },
            fontFamily: {
                lora: ["Lora", "serif"],
                roboto: ["Roboto", "sans-serif"], // Add Roboto font here
            },
            colors: {
                headerBackgroundColor: "#2F2E2E",
                borderColor: "#808080",
                sideBarBackgroundColor: "rgba(50, 50, 50, 0.85)",
                drillReportButtonBackgroundColor: "#C0C0C0",
                legendBorderColor: "#808080",
                legendBackgroundColor: "rgba(50, 50, 50, 0.85)",
            },
            boxShadow: {
                topShadow: "0 -10px 20px rgba(0, 0, 0, 0.3)",
            },
            screens: {
                sm: "420px",
                // => @media (min-width: 640px) { ... }
                // md: "768px",
                md: "857px",
                // => @media (min-width: 768px) { ... }

                lg: "1024px",
                // => @media (min-width: 1024px) { ... }

                xl: "1280px",
                // => @media (min-width: 1280px) { ... }

                "2xl": "1536px",
                // => @media (min-width: 1536px) { ... }
            },
        },
    },
    plugins: [],
};
