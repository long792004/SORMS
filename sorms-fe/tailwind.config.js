/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        primary: "#2563EB",
        secondary: "#06B6D4",
        accent: "#F59E0B",
        success: "#10B981",
        error: "#EF4444",
        background: "#0F172A",
        surface: "#FFFFFF",
        foreground: "#E2E8F0"
      },
      boxShadow: {
        glass: "0 20px 50px rgba(15, 23, 42, 0.35)",
        soft: "0 8px 25px rgba(15, 23, 42, 0.18)"
      },
      borderRadius: {
        xl: "12px"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        "radial-lux": "radial-gradient(circle at 5% 5%, rgba(37,99,235,0.25), transparent 35%), radial-gradient(circle at 95% 90%, rgba(6,182,212,0.18), transparent 35%)"
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.1", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        h3: ["28px", { lineHeight: "1.25", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.6" }],
        small: ["14px", { lineHeight: "1.5" }]
      }
    }
  },
  plugins: []
};