import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effdfb",
          100: "#c8f7f0",
          200: "#92ede1",
          300: "#58dcc9",
          400: "#2fc3b0",
          500: "#14a896",
          600: "#0c8a7b",
          700: "#0e6e64",
          800: "#105853",
          900: "#114945",
        },
        ink: {
          900: "#0b1220",
          700: "#1f2937",
          500: "#6b7280",
          300: "#d1d5db",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Noto Serif KR", "serif"],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(15, 23, 42, 0.08)",
        pop: "0 12px 40px -10px rgba(20, 168, 150, 0.35)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn .45s ease-out both",
        floaty: "floaty 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
