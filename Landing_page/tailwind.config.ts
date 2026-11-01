import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        surface: "#f9f9f9",
        "surface-bright": "#f9f9f9",
        "surface-dim": "#dadad9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3f3",
        "surface-container": "#eeeeed",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#444748",
        outline: "#747878",
        "outline-variant": "#c4c7c7",
        secondary: "#4648d4",
        "secondary-fixed": "#e1e0ff",
        "secondary-container": "#6063ee",
        error: "#ba1a1a",
      },
      fontFamily: {
        geist: ["Geist", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "marquee-fast": "marquee 25s linear infinite",
        "orbit-pulse": "orbitPulse 4s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        orbitPulse: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.03)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
