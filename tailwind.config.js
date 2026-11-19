/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#13357B",
        secondary: "#1f05e6",
        "auth-surface": "#D4EBF8",
        surface: "#F2F2F2",
        ink: "#14141F",
      },
    },
  },
  plugins: [],
};
