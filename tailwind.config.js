/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#12151d",
          900: "#181b24",
          800: "#20242e",
          700: "#2b303b",
          600: "#3a4050",
        },
        gold: {
          300: "#f2dba2",
          400: "#e9c46a",
          500: "#d4a23d",
          600: "#b8862a",
        },
        accent: {
          400: "#7dd3fc",
          500: "#38bdf8",
        },
      },
      fontFamily: {
        display: ["'Manrope'", "system-ui", "sans-serif"],
        sans: ["'Manrope'", "system-ui", "sans-serif"],
        /** Top bar + quote generator blockquotes only */
        serif: ["'EB Garamond'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(0, 0, 0, 0.48)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "spin-slow": "spinSlow 14s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
