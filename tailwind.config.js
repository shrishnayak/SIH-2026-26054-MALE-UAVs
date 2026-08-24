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
          bg: '#030712',
          card: '#0A192F',
          cardBorder: '#1E293B',
          cardHover: '#132A4A',
          cyan: '#00F0FF',
          cyanGlow: 'rgba(0, 240, 255, 0.25)',
          amber: '#F59E0B',
          amberGlow: 'rgba(245, 158, 11, 0.25)',
          red: '#EF4444',
          redGlow: 'rgba(239, 68, 68, 0.25)',
          green: '#10B981',
          greenGlow: 'rgba(16, 185, 129, 0.25)',
          blue: '#0284C7',
          panel: 'rgba(10, 25, 47, 0.85)',
          grid: '#0F2744',
          textMuted: '#94A3B8',
          textBright: '#F8FAFC',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        hud: ['"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'hud-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'hud-cyan-lg': '0 0 30px rgba(0, 240, 255, 0.5)',
        'hud-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'hud-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        'hud-green': '0 0 15px rgba(16, 185, 129, 0.35)',
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
