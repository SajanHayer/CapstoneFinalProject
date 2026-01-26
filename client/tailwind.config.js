// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clean, modern palette (slate + teal accent)
        primary: {
          50: "#eef9f8",
          100: "#d7f1ee",
          200: "#b0e3de",
          300: "#7fcfca",
          400: "#4ab7b1",
          500: "#1f9a95",
          600: "#167b77",
          700: "#0f5f5c",
          800: "#0b4745",
          900: "#083736",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 6, 23, 0.08)",
        glow: "0 0 0 1px rgba(15, 23, 42, 0.06), 0 20px 45px rgba(2, 6, 23, 0.12)",
      },
    },
  },
  plugins: [],
};

