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
        hud: {
          bg: '#080B0A',
          card: '#0B1F17',
          cardBorder: '#234236',
          cardHover: '#123324',
          cyan: '#19C7A5',
          cyanGlow: 'rgba(25, 199, 165, 0.18)',
          amber: '#FFB020',
          amberGlow: 'rgba(255, 176, 32, 0.22)',
          red: '#FF4D4D',
          redGlow: 'rgba(255, 77, 77, 0.22)',
          green: '#39FF88',
          greenGlow: 'rgba(57, 255, 136, 0.16)',
          blue: '#19C7A5',
          panel: '#0B1F17',
          grid: '#1D3B2E',
          textMuted: '#8D9B95',
          textBright: '#E5ECE8',
        }
      },
      slate: {
        950: '#050908',
        900: '#08120E',
        800: '#10231B',
        700: '#1B382B',
        600: '#2B4A3B',
        500: '#526A5D',
        400: '#8D9B95',
        300: '#B8C8C0',
        200: '#D5E0DA',
        100: '#E5ECE8',
        50: '#F3F8F5',
      },
      blue: { 400: '#19C7A5', 500: '#19C7A5', 600: '#19C7A5' },
      cyan: { 400: '#19C7A5', 500: '#19C7A5' },
      purple: { 300: '#8FD7C4', 400: '#6CC7B1', 500: '#3EA58D' },
      fontFamily: {
        mono: ['"Amazon Ember"', '"Segoe UI"', 'sans-serif'],
        display: ['"Amazon Ember"', '"Segoe UI"', 'sans-serif'],
        hud: ['"Amazon Ember"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'hud-cyan': '0 0 16px rgba(25, 199, 165, 0.16)',
        'hud-cyan-lg': '0 0 28px rgba(25, 199, 165, 0.22)',
        'hud-amber': '0 0 16px rgba(255, 176, 32, 0.14)',
        'hud-red': '0 0 16px rgba(255, 77, 77, 0.16)',
        'hud-green': '0 0 16px rgba(57, 255, 136, 0.14)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 4s linear infinite',
        'scanline': 'scan 6s linear infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
