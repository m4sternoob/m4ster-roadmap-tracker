/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--accent-soft)',
          100: 'var(--accent-soft)',
          200: 'var(--accent-bright)',
          300: 'var(--accent-bright)',
          400: 'var(--accent-bright)',
          500: 'var(--accent)',
          600: 'var(--accent-deep)',
          700: 'var(--accent-deep)',
          800: 'var(--accent-deep)',
          900: 'var(--accent-deep)',
          950: 'var(--accent-deep)',
        },
        dark: {
          bg: 'var(--bg-app)',
          card: 'var(--bg-surface)',
          border: 'var(--chrome)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
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
        'toast-in': 'toastIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
        'fade-up': 'fadeUp 0.25s cubic-bezier(0, 0, 0.2, 1) both',
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
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
