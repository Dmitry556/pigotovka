/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'question': ['28px', '32px'],
        'option': ['20px', '24px'],
        'explanation': ['16px', '20px']
      }
    },
  },
  plugins: [],
}