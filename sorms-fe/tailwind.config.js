/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Sora", "Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        primary: "#0f766e",
        secondary: "#1d4ed8",
        accent: "#f59e0b",
        success: "#059669",
        error: "#dc2626",
        background: "#f4f7f6",
        surface: "#ffffff",
        foreground: "#0f172a"
      },
      boxShadow: {
        glass: "0 18px 60px rgba(15, 23, 42, 0.14)",
        soft: "0 8px 28px rgba(2, 12, 27, 0.10)",
        panel: "0 26px 80px rgba(8, 47, 73, 0.12)"
      },
      borderRadius: {
        xl: "14px"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)",
        "radial-lux": "radial-gradient(circle at 4% 4%, rgba(20,184,166,0.22), transparent 34%), radial-gradient(circle at 96% 92%, rgba(29,78,216,0.16), transparent 34%)"
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.06", fontWeight: "700" }],
        h2: ["34px", { lineHeight: "1.15", fontWeight: "700" }],
        h3: ["26px", { lineHeight: "1.2", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.6" }],
        small: ["14px", { lineHeight: "1.5" }]
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        "fade-rise": "fade-rise 500ms ease-out both",
        shimmer: "shimmer 8s linear infinite"
      }
    }
  },
  plugins: []
};