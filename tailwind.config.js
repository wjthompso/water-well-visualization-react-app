/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                lora: ["Lora", "serif"],
                roboto: ["Roboto", "sans-serif"], // Add Roboto font here
            },
            colors: {
                borderColor: "#808080",
                sideBarBackgroundColor: "rgba(50, 50, 50, 0.85)",
                drillReportButtonBackgroundColor: "#C0C0C0",
                legendBorderColor: "#808080",
                legendBackgroundColor: "rgba(50, 50, 50, 0.85)",
            },
        },
    },
    plugins: [],
};
