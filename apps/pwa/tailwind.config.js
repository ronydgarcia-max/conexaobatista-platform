/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'batista-blue': '#0A2540',
        'batista-gold': '#D4AF37',
        'batista-light': '#F8FAFC',
      },
    },
  },
  plugins: [],
}