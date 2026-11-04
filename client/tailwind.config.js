/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#0b5fff',
          600: '#0047d4',
          700: '#0039ab',
          900: '#0a1f44',
        },
        surface: '#f5f8fc',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Segoe UI', 'sans-serif'],
        display: ['"Libre Baskerville"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(11, 95, 255, 0.18)',
      },
    },
  },
  plugins: [],
};
