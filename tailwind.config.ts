import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      maxWidth: {
        "8xl": "96rem",
      },
      animation: {
        wiggle: "wiggle 0.3s ease-in-out",
        smallwave: "smallwave 1.2s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(10deg)" },
          "50%": { transform: "rotate(-10deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        smallwave: {
          "0%": { transform: "translateY(0)" },
          "10%": { transform: "translateY(-4px)" },
          "25%": { transform: "translateY(2px)" },
          "35%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui(), require("@tailwindcss/typography")],
};
export default config;
