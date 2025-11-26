/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rosa-pastel-1': '#ffc3d5',
        'rosa-pastel-2': '#ffb3c6',
        'rosa-medio': '#ff758c',
        'lila-claro': '#f0e6ff',
        'lila-medio': '#e6b8ff',
      }
    },
  },
  plugins: [],
}
