/** @type {import('tailwindcss').Config} */
export default {
  important: '#root',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../ai-assistant/src/**/*.{js,ts,jsx,tsx}",
    "../baby-tracker/src/**/*.{js,ts,jsx,tsx}",
    "../bible-reader/src/**/*.{js,ts,jsx,tsx}",
    "../city-search/src/**/*.{js,ts,jsx,tsx}",
    "../notebook/src/**/*.{js,ts,jsx,tsx}",
    "../podcast-player/src/**/*.{js,ts,jsx,tsx}",
    "../stock-tracker/src/**/*.{js,ts,jsx,tsx}",
    "../weather-display/src/**/*.{js,ts,jsx,tsx}",
    "../worship-songs/src/**/*.{js,ts,jsx,tsx}",
    "../child-development/src/**/*.{js,ts,jsx,tsx}",
    "../english-learning/src/**/*.{js,ts,jsx,tsx}",
    "../chinese-learning/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
}
