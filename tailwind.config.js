/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html',],
  theme: {
    extend: {
      flex: {
        '1/2': '.5 1 0%',
        '1-1/2': '1.5 1 0%'
      },
      maxWidth: {
        'xxs': '10rem'
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio')
  ],
  darkMode: 'class',
}