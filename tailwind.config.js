/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ticket-burgundy': '#7A1F2B',
        'ticket-burgundy-dark': '#5F1821',
        'ticket-gold': '#F5A300',
        'ticket-gold-light': '#FFC043',
        'ticket-ivory': '#FFFDF8',
        'ticket-cream': '#FAF6EE',
        'ticket-beige': '#EDE3D5',
        'ticket-charcoal': '#292725',
        'ticket-muted': '#77736D',
        'ticket-white': '#FFFFFF',
        'ticket-pale-burgundy': '#FBF3F4',
        'ticket-pale-gold': '#FFF8E8',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
