import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfff7',
          100: '#d0ffe8',
          500: '#10b981',
          700: '#047857',
          900: '#052e16',
        },
      },
      boxShadow: {
        soft: '0 18px 40px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
