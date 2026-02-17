import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1320px"
      }
    },
    extend: {
      colors: {
        brand: "#171a20",
        "brand-600": "#0f1115",
        "brand-soft": "#f1f2f4",
        ink: "#111318",
        muted: "#5f6368",
        "background-dark": "#f5f5f6",
        "background-light": "#ffffff",
        "surface-dark": "#ffffff",
        "surface-border": "#d9dadd",
        "sidebar-bg": "#f8f8f9",
        "text-secondary": "#5f6368",
        critical: "#b3261e",
        warning: "#bb5a00",
        success: "#1f7a43",
        healthy: "#10b981",
        attention: "#f59e0b",
        primary: "#171a20",
        "primary-dark": "#0f1115"
      },
      fontFamily: {
        display: ["Manrope", "ui-sans-serif", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem"
      },
      boxShadow: {
        panel: "0 6px 24px rgba(15, 23, 42, 0.06)",
        soft: "0 2px 10px rgba(15, 23, 42, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
