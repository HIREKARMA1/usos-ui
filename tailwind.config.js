const theme = require('./theme/theme.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
          DEFAULT: 'var(--color-primary)',
          ...theme.colors.primary,
        },
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
        neutral: theme.colors.neutral,
        surface: {
          page: 'var(--color-surface-page)',
          card: 'var(--color-surface-card)',
          muted: 'var(--color-surface-muted)',
          soft: 'var(--color-surface-soft)',
          hero: theme.colors.surface.hero,
        },
        muted: {
          DEFAULT: 'var(--color-surface-muted)',
          foreground: 'var(--color-text-muted)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          link: 'var(--color-text-link)',
          linkHover: 'var(--color-text-link-hover)',
        },
        line: {
          DEFAULT: 'var(--color-line)',
          default: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-border-focus)',
        },
        state: theme.colors.semantic,
        sky: theme.brand.sky,
        yellow: theme.brand.yellow,
        orange: theme.brand.orange,
        red: theme.brand.red,
        green: theme.brand.green,
        soft: 'var(--color-surface-soft)',
      },
      borderRadius: {
        ...theme.radius,
      },
      boxShadow: {
        card: 'var(--shadow-md)',
        elevated: 'var(--shadow-lg)',
        soft: 'var(--shadow-sm)',
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
