const theme = require('./theme/theme.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: theme.brand,
        primary: {
          DEFAULT: theme.brand.blue,
          ...theme.colors.primary,
        },
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
        neutral: theme.colors.neutral,
        surface: theme.colors.surface,
        muted: {
          DEFAULT: theme.colors.surface.muted,
          foreground: theme.colors.text.muted,
        },
        ink: {
          DEFAULT: theme.colors.text.primary,
          ...theme.colors.text,
        },
        line: {
          DEFAULT: theme.colors.border.default,
          ...theme.colors.border,
        },
        state: theme.colors.semantic,
        sky: theme.brand.sky,
        yellow: theme.brand.yellow,
        orange: theme.brand.orange,
        red: theme.brand.red,
        green: theme.brand.green,
        soft: theme.colors.surface.soft,
      },
      borderRadius: {
        ...theme.radius,
      },
      boxShadow: {
        card: theme.colors.shadow.md,
        elevated: theme.colors.shadow.lg,
        soft: theme.colors.shadow.sm,
      },
      backgroundImage: {
        'hero-gradient': 'var(--gradient-hero)',
        'brand-stripe': 'var(--gradient-brand-stripe)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
