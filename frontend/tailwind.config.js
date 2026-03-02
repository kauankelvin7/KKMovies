/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        kf: {
          bg: '#08080F',
          'bg-secondary': '#0F0F1A',
          card: '#13131F',
          elevated: '#1C1C2E',
          accent: '#7B2FFF',
          'accent-hover': '#9B5FFF',
          'accent-light': '#BF5AF2',
          yellow: '#F5C518',
          success: '#34D399',
          info: '#38BDF8',
          danger: '#EF4444',
          'text-secondary': '#A0A0B0',
          'text-muted': '#5A5A72',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        ui: ['Inter', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #7B2FFF 0%, #BF5AF2 100%)',
        'hero-gradient': 'linear-gradient(to right, rgba(8,8,15,0.95) 30%, transparent 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(8,8,15,0.98) 0%, transparent 65%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(123, 47, 255, 0.35)',
        'glow-lg': '0 0 40px rgba(123, 47, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
