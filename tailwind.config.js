/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#FFD700",
        "kingdom-black": "#000000",
        "kingdom-gray": "#1f1f1f",   // darker gray
        "kingdom-lightgray": "#d1d5db", // lighter text gray
        "kingdom-white": "#ffffff",
      },
    },
  },
  plugins: [],
};
