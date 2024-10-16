/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      'tupi': ['NovoTupi', 'sans-serif'],
      'opensans': ['Open Sans', 'sans-serif'],
      'newsreader': ['Newsreader', 'sans-serif'],
    }
  },
  plugins: [],
}

