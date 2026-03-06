import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080810",
        foreground: "#f0f0f5",
        card: "rgba(255, 255, 255, 0.05)",
        "card-foreground": "#f0f0f5",
        border: "rgba(255, 255, 255, 0.1)",
        primary: "#7c6af7",
        "primary-foreground": "#ffffff",
        muted: "rgba(255, 255, 255, 0.06)",
        "muted-foreground": "rgba(255, 255, 255, 0.5)",
        accent: "rgba(255, 255, 255, 0.08)",
        "accent-foreground": "#f0f0f5",
        destructive: "#f7836a",
        "destructive-foreground": "#ffffff",
        ring: "#7c6af7",
        mood: {
          happy: "#4fd6a0",
          sad: "#6af1f7",
          energetic: "#f7836a",
          calm: "#7c6af7",
          focused: "#f7c96a",
        },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
