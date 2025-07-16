/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        lg: '1rem',
      },
      screens: {
        lg: '1024px',
        xl: '1326px',
      },
    },
    extend: {
      screens: {
        '2md': '1440px',
      },
      boxShadow: {
        'red-glow': '0 4px 20px 0 rgba(230,57,70,0.5)',
      },
      borderRadius: {
        'xl': '1rem',
      },
      colors: {
        dark: {
          900: '#18181b',
          800: '#232326',
          700: '#2d2d31',
          600: '#3a3a3e',
        },
        red: {
          100: '#ffe5e5',
          200: '#fbbcbc',
          400: '#f87171',
          600: '#e63946',
          700: '#d62839',
          800: '#a4161a',
        },
        accent: {
          500: '#ff1744', // Vermelho vibrante para botões/destaques
        },
        text: {
          light: '#f3f4f6',
          dark: '#18181b',
        },
      },
    },
  },
  plugins: [],
};