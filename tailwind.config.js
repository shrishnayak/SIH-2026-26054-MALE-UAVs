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
        carbon: {
          950: '#07090D',
          900: '#0C1017',
          850: '#111620',
          800: '#161D2A',
          750: '#1D2536',
          700: '#252F43',
          600: '#323E56',
          500: '#485775',
        },
        tactical: {
          amber: '#C59B27', // Warm Champagne Bronze / Titanium Gold
          gold: '#D4A373',  // Brushed Titanium Champagne
          glow: 'rgba(197, 155, 39, 0.18)',
          darkAmber: '#785A12',
          bronze: '#967230',
          champagne: '#DFBE82',
        },
        steel: {
          slate: '#64748B',
          light: '#CBD5E1',
          dim: '#475569',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        defense: {
          sage: '#2E7D5A',   // Muted Military Instrument Green
          sageDim: '#1B4733',
          crimson: '#9E2A2B', // Muted Restrained Defense Crimson
          crimsonDim: '#5C1D1E',
          ochre: '#C59B27',
        },
        hud: {
          bg: '#07090D',
          surface: '#0C1017',
          surfaceAlt: '#111620',
          border: 'rgba(197, 155, 39, 0.18)',
          borderSubtle: 'rgba(255, 255, 255, 0.07)',
          amber: '#C59B27',
          gold: '#D4A373',
          red: '#9E2A2B',
          green: '#2E7D5A',
          textMuted: '#7E8A9C',
          textBright: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        tactical: ['"Rajdhani"', 'sans-serif'],
        syne: ['"Syne"', 'sans-serif'],
        hud: ['"Space Grotesk"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'tactical-amber': '0 4px 20px rgba(197, 155, 39, 0.15)',
        'tactical-amber-lg': '0 8px 30px rgba(197, 155, 39, 0.22)',
        'hud-glass': '0 16px 36px rgba(3, 5, 8, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'hud-glass-amber': '0 16px 36px rgba(3, 5, 8, 0.65), 0 0 20px rgba(197, 155, 39, 0.1), inset 0 1px 0 rgba(197, 155, 39, 0.18)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 5s linear infinite',
        'scanline': 'scan 10s linear infinite',
        'float-slow': 'float 7s ease-in-out infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
