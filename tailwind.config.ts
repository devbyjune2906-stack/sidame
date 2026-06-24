import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        petroleum: {
          DEFAULT: "#0B5E54",
          dark: "#08443D",
          light: "#0F7A6E",
        },
        sand: "#0D1E31",
        surface: "#112843",
        ink: "#DCE9F6",
        muted: "#7A9EC0",
        line: "#1D3B5A",
        warn: "#C9821B",
        danger: "#B4322B",
        ok: "#2E7D5B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,33,31,0.04), 0 1px 3px rgba(16,33,31,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
