/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1DB954",
        background: "#0a0a0a",
        surface: "#1a1a1a",
        surfaceLight: "#2a2a2a",
        muted: "#999999",
        mutedDark: "#666666",
      },
      fontFamily: {
        // usa system font para performance (sem carregar fonte custom)
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
