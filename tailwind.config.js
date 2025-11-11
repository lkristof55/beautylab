/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        porcelain: '#FCFCFC',
        pink: '#F7E9EC',
        beige: '#EEDFD6',
        graphite: '#2B2B2B',
        gold: '#C2A063',
      },
      fontFamily: {
        heading: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(194, 160, 99, 0.35)', // gold glow
      },
    },
  },
  plugins: [],
};
