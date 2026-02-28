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
        primary: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          dark: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#D1FAE5',
        },
        dark: '#0F172A',
        'gray-100': '#F8FAFC',
        'gray-200': '#F1F5F9',
        'gray-500': '#64748B',
        // WhatsApp Green (kept for existing pages)
        wa: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          light: '#dcfce7',
        },
        // Dark surfaces (kept for existing dashboard)
        surface: {
          DEFAULT: '#1C1C1C',
          50: '#2a2a2a',
          100: '#242424',
          200: '#1c1c1c',
          300: '#141414',
          400: '#0d0d0d',
        },
        border: {
          DEFAULT: '#2a2a2a',
          light: '#3a3a3a',
        },
        muted: '#6b7280',
        subtle: '#9ca3af',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Outfit', 'DM Sans', 'ui-sans-serif', 'system-ui'],
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
        'glow-primary': '0 0 30px rgba(37, 99, 235, 0.2)',
        card: '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
        'card-dark': '0 2px 8px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':        'fadeIn 0.2s ease-in-out',
        'slide-up':       'slideUp 0.25s ease-out',
        'slide-in-left':  'slideInLeft 0.28s ease-out',
        'pulse-glow':     'pulseGlow 2s infinite',
        'fade-up':        'fadeUp 0.6s ease-out forwards',
        'counter':        'counter 2s ease-out forwards',
        'typing':         'typing 1.2s ease-in-out infinite',
        'bubble-in':      'bubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-in-bottom': 'slideInBottom 0.5s ease-out forwards',
        'ripple':         'ripple 0.6s ease-out forwards',
        'checkmark':      'checkmark 0.5s ease-out forwards',
        'float':          'float 3s ease-in-out infinite',
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
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%':           { transform: 'translateY(-6px)' },
        },
        bubbleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.8) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideInBottom: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        checkmark: {
          '0%':   { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
