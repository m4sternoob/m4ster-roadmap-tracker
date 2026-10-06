/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e9f2ff',
          100: '#cce0ff',
          200: '#85b8ff',
          300: '#579dff',
          400: '#388bff',
          500: '#0c66e4',
          600: '#0055cc',
          700: '#004491',
          800: '#00387a',
          900: '#002e5f',
          950: '#001f3d',
        },
        dark: {
          bg: '#1d2125',
          card: '#22272b',
          border: '#2c333a',
          text: '#e6edf3',
          muted: '#8c9bab',
        },
        'muted-foreground': 'var(--muted-foreground)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
