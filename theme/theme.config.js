/**
 * SINGLE SOURCE OF TRUTH — HireKarma brand palette + derived tokens for U.S.O.S.
 * Change colors, fonts, radii, shadows here only.
 *
 * Brand palette (6 colors):
 *   blue   #1b52a4  — primary actions, logo, links
 *   sky    #00a2e5  — secondary, info, highlights
 *   yellow #fec40d  — warnings, badges
 *   orange #f58020  — accent CTAs, emphasis
 *   red    #d64246  — errors, destructive
 *   green  #098855  — success, active states
 */
module.exports = {
  fonts: {
    sans: 'Inter',
    display: 'DM Sans',
    mono: 'JetBrains Mono',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  brand: {
    blue: '#1b52a4',
    sky: '#00a2e5',
    yellow: '#fec40d',
    orange: '#f58020',
    red: '#d64246',
    green: '#098855',
  },
  colors: {
    primary: {
      50: '#e8eef8',
      100: '#c5d4eb',
      200: '#9eb8dd',
      300: '#779ccf',
      400: '#4a78b8',
      500: '#1b52a4',
      600: '#174892',
      700: '#133d7d',
      800: '#0f3268',
      900: '#0a2550',
    },
    secondary: {
      50: '#e6f7fd',
      100: '#b3e8f8',
      200: '#80d9f3',
      300: '#4dc9ee',
      400: '#26bbea',
      500: '#00a2e5',
      600: '#0091cc',
      700: '#007fb3',
      800: '#006d99',
      900: '#005b80',
    },
    accent: {
      yellow: '#fec40d',
      orange: '#f58020',
      red: '#d64246',
      green: '#098855',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    surface: {
      page: '#ffffff',
      card: '#ffffff',
      muted: '#f6f8fb',
      soft: '#f6f8fb',
      hero: 'linear-gradient(165deg, #0a2550 0%, #133d7d 40%, #1b52a4 70%, #00a2e5 100%)',
    },
    text: {
      primary: '#0f1622',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff',
      link: '#1b52a4',
      linkHover: '#174892',
    },
    border: {
      default: '#e6e8ec',
      strong: '#c5d4eb',
      focus: '#1b52a4',
    },
    semantic: {
      success: '#098855',
      warning: '#fec40d',
      error: '#d64246',
      info: '#00a2e5',
    },
    shadow: {
      sm: '0 1px 2px rgba(27, 82, 164, 0.06)',
      md: '0 4px 16px rgba(27, 82, 164, 0.1)',
      lg: '0 12px 40px rgba(27, 82, 164, 0.14)',
    },
  },
};
