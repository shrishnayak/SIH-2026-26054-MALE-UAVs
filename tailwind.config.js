/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ---- Core neutral system (macOS-dark / YouTube-dark inspired) ---- */
        canvas: '#0A0A0C',
        surface: {
          DEFAULT: '#131316',
          raised: '#191920',
          sunken: '#0E0E11',
          inset: '#0B0B0E',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.09)',
          strong: 'rgba(255,255,255,0.16)',
          faint: 'rgba(255,255,255,0.05)',
        },
        ink: {
          DEFAULT: '#F2F2F7',
          muted: '#A1A1A6',
          faint: '#7C7C82',
          dim: '#58585E',
        },
        /* ---- System accent (macOS blue) ---- */
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#3D9BFF',
          press: '#0A6BD0',
          soft: 'rgba(10,132,255,0.14)',
          ring: 'rgba(10,132,255,0.45)',
        },
        success: { DEFAULT: '#30D158', soft: 'rgba(48,209,88,0.14)' },
        warning: { DEFAULT: '#FF9F0A', soft: 'rgba(255,159,10,0.14)' },
        danger: { DEFAULT: '#FF453A', soft: 'rgba(255,69,58,0.14)' },
        info: { DEFAULT: '#64D2FF', soft: 'rgba(100,210,255,0.14)' },
        violet: { DEFAULT: '#BF5AF2', soft: 'rgba(191,90,242,0.14)' },
        /* ---- Machined-metal accents used by the CAD studio ---- */
        alloy: {
          200: '#EDEFF2',
          300: '#D8DBE0',
          400: '#B4B9C1',
          500: '#8C9199',
          600: '#5F646B',
          700: '#3C4046',
          800: '#26292E',
          900: '#17191D',
        },
        brass: {
          300: '#EBD3A3',
          400: '#D6AE69',
          500: '#B88A3E',
          600: '#8E6828',
        },

        /* =========================================================================
           Legacy tokens kept as aliases so every remaining view inherits the new
           neutral, glow-free palette without a rewrite.
           ========================================================================= */
        carbon: {
          950: '#0A0A0C',
          900: '#131316',
          850: '#17171B',
          800: '#1D1D22',
          750: '#242429',
          700: '#2E2E34',
          600: '#3B3B42',
          500: '#4E4E56',
        },
        tactical: {
          amber: '#0A84FF',
          gold: '#A1A1A6',
          glow: 'rgba(10,132,255,0.14)',
          darkAmber: '#0A6BD0',
          bronze: '#8C9199',
          champagne: '#D8DBE0',
        },
        steel: {
          slate: '#8E8E93',
          light: '#D1D1D6',
          dim: '#4E4E56',
          border: 'rgba(255,255,255,0.09)',
        },
        defense: {
          sage: '#30D158',
          sageDim: '#1B6B37',
          crimson: '#FF453A',
          crimsonDim: '#7A2019',
          ochre: '#FF9F0A',
        },
        hud: {
          bg: '#0A0A0C',
          surface: '#131316',
          surfaceAlt: '#191920',
          border: 'rgba(255,255,255,0.10)',
          borderSubtle: 'rgba(255,255,255,0.06)',
          amber: '#0A84FF',
          gold: '#A1A1A6',
          red: '#FF453A',
          green: '#30D158',
          cyan: '#64D2FF',
          textMuted: '#8E8E93',
          textBright: '#F2F2F7',
        },
        cryo: {
          teal: '#64D2FF',
          tealDim: '#1F7C9C',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        hud: ['"Inter"', 'system-ui', 'sans-serif'],
        tactical: ['"Inter"', 'system-ui', 'sans-serif'],
        syne: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      borderRadius: {
        xl2: '14px',
        xl3: '18px',
      },
      boxShadow: {
        /* Flat, elevation-only shadows: no neon bloom. */
        panel: '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.28)',
        raised: '0 2px 6px rgba(0,0,0,0.4), 0 18px 44px rgba(0,0,0,0.35)',
        popover: '0 10px 40px rgba(0,0,0,0.55)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        'tactical-amber': '0 1px 2px rgba(0,0,0,0.35)',
        'tactical-amber-lg': '0 12px 32px rgba(0,0,0,0.35)',
        'hud-glass': '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.28)',
        'hud-glass-amber': '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.28)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 5s linear infinite',
        'scanline': 'scan 10s linear infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
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
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
