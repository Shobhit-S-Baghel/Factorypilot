import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: "#F8FAFC",
          panel: "#FFFFFF",
          border: "#E2E8F0",
          borderHover: "#CBD5E1",
          text: "#0F172A",
          muted: "#64748B",
          subtle: "#94A3B8",
          darkBg: "#0B0F19",
          darkPanel: "#131D31",
          darkBorder: "#1E293B",
        },
        status: {
          nominal: "#10B981",    // Emerald
          warning: "#F59E0B",    // Amber
          critical: "#EF4444",   // Rose/Crimson
          active: "#0D9488",     // Steel Teal
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
