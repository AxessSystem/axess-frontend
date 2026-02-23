/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // WhatsApp Green
        wa: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          light: '#dcfce7',
        },
        // Supabase / Axess Accent
        accent: {
          DEFAULT: '#3ECF8E',
          dark: '#2bb377',
          light: '#d1fae5',
        },
        // Dark backgrounds
        surface: {
          DEFAULT: '#1C1C1C',
          50: '#2a2a2a',
          100: '#242424',
          200: '#1c1c1c',
          300: '#141414',
          400: '#0d0d0d',
        },
        // Border
        border: {
          DEFAULT: '#2a2a2a',
          light: '#3a3a3a',
        },
        // Text
        muted: '#6b7280',
        subtle: '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(37, 211, 102, 0.15)',
        'glow-accent': '0 0 20px rgba(62, 207, 142, 0.2)',
        card: '0 2px 8px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':        'fadeIn 0.2s ease-in-out',
        'slide-up':       'slideUp 0.25s ease-out',
        'slide-in-left':  'slideInLeft 0.28s ease-out',
        'pulse-glow':     'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(37,211,102,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(37,211,102,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
