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
          DEFAULT: '#00C37A',
          light: 'rgba(0,195,122,0.12)',
          dark: '#00A366',
        },
        accent: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: 'rgba(99,102,241,0.12)',
        },
        dark: '#080C14',
        'gray-100': '#F8FAFC',
        'gray-200': '#EFF3F8',
        'gray-500': '#64748B',
        // WhatsApp Green (kept for existing pages)
        wa: {
          DEFAULT: '#00C37A',
          dark: '#00A366',
          light: 'rgba(0,195,122,0.12)',
        },
        // Dark surfaces — mapped to v2 design system
        surface: {
          DEFAULT: '#161E2E',
          50: '#1A2236',
          100: '#0F1623',
          200: '#080C14',
          300: '#0A0E18',
          400: '#060910',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          light: 'rgba(255,255,255,0.16)',
        },
        muted: '#94A3B8',
        subtle: '#CBD5E1',
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
