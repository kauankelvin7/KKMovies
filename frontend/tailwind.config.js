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
        /* HBO-inspired 4-surface palette */
        surface: {
          0: '#050508',
          1: '#0D0D14',
          2: '#141420',
          3: '#1C1C2E',
        },
        /* Accents */
        accent: {
          blue: '#4A90D9',
          'blue-dim': 'rgba(74,144,217,0.15)',
          gold: '#C9973A',
          'gold-dim': 'rgba(201,151,58,0.15)',
        },
        /* Keep backward compatibility for any remaining references */
        kf: {
          bg: '#050508',
          'bg-secondary': '#0D0D14',
          card: '#0D0D14',
          elevated: '#1C1C2E',
          accent: '#4A90D9',
          'accent-hover': '#6aaae8',
          'accent-light': '#4A90D9',
          yellow: '#C9973A',
          success: '#34D399',
          info: '#4A90D9',
          danger: '#EF4444',
          'text-secondary': 'rgba(255,255,255,0.7)',
          'text-muted': 'rgba(255,255,255,0.45)',
        },
      },
      fontFamily: {
        /* Inter only — weight 300 for the editorial, light HBO feel */
        base: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        ui: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'], /* Overrides Bebas Neue — now Inter 300 */
      },
      backgroundImage: {
        'hero-gradient-left': 'linear-gradient(to right, #050508 0%, #050508 20%, transparent 55%)',
        'hero-gradient-bottom': 'linear-gradient(to top, #050508 0%, transparent 40%)',
        'card-gradient': 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 65%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.25s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 2s linear infinite',
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
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(74,144,217,0.3)',
        'glow-blue-lg': '0 0 40px rgba(74,144,217,0.4)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.7)',
      },
      spacing: {
        'padding-desktop': '80px',
        'padding-tablet': '40px',
        'padding-mobile': '16px',
      },
    },
  },
  plugins: [],
}
