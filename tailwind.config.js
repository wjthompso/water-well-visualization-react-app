/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                lora: ["Lora", "serif"],
            },
            colors: {
                borderColor: "#808080",
                sideBarBackgroundColor: "rgba(50, 50, 50, 0.85)",
            },
        },
    },
    plugins: [],
};
