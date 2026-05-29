import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#4CAF50',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#0d3d12',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        screen: '100dvh',
      },
      height: {
        screen: '100dvh',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.pb-safe': { 'padding-bottom': 'env(safe-area-inset-bottom)' },
        '.pt-safe': { 'padding-top': 'env(safe-area-inset-top)' },
        '.pl-safe': { 'padding-left': 'env(safe-area-inset-left)' },
        '.pr-safe': { 'padding-right': 'env(safe-area-inset-right)' },
        '.mb-safe': { 'margin-bottom': 'env(safe-area-inset-bottom)' },
        '.mt-safe': { 'margin-top': 'env(safe-area-inset-top)' },
        '.h-screen-dvh': { height: '100dvh' },
        '.min-h-screen-dvh': { 'min-height': '100dvh' },
      });
    },
  ],
} satisfies Config;
