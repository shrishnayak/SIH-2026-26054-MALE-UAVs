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
          bg: '#090A0F',
          card: '#141A23',
          cardBorder: '#2D3748',
          cardHover: '#1E293B',
          cyan: '#2563EB',
          cyanGlow: 'rgba(37, 99, 235, 0.18)',
          amber: '#D97706',
          amberGlow: 'rgba(245, 158, 11, 0.25)',
          red: '#EF4444',
          redGlow: 'rgba(239, 68, 68, 0.25)',
          green: '#16A34A',
          greenGlow: 'rgba(22, 163, 74, 0.18)',
          blue: '#2563EB',
          panel: '#141A23',
          grid: '#334155',
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
        'hud-cyan': 'none',
        'hud-cyan-lg': 'none',
        'hud-amber': 'none',
        'hud-red': 'none',
        'hud-green': 'none',
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
