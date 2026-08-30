import themeConfig from './theme.config.js';

export const theme = themeConfig;

export type Theme = typeof theme;
export type ColorMode = 'light' | 'dark';

const darkSurfaces = {
  page: '#0b1220',
  card: '#121a2b',
  muted: '#1a2438',
  soft: '#0f172a',
  hero: 'linear-gradient(165deg, #020617 0%, #0a2550 40%, #133d7d 70%, #1b52a4 100%)',
};

const darkText = {
  primary: '#f1f5f9',
  secondary: '#cbd5e1',
  muted: '#94a3b8',
  inverse: '#0f1622',
  link: '#60a5fa',
  linkHover: '#93c5fd',
};

const darkBorder = {
  default: '#243044',
  strong: '#334155',
  focus: '#60a5fa',
};

const darkNeutral: Record<string, string> = {
  50: '#0f172a',
  100: '#1e293b',
  200: '#334155',
  300: '#475569',
  400: '#64748b',
  500: '#94a3b8',
  600: '#cbd5e1',
  700: '#e2e8f0',
  800: '#f1f5f9',
  900: '#f8fafc',
};

const darkShadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.35)',
  md: '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.5)',
};

export function themeToCssVariables(t: Theme = theme, mode: ColorMode = 'light'): Record<string, string> {
  const { brand } = t;
  const isDark = mode === 'dark';
  const surface = isDark ? darkSurfaces : t.colors.surface;
  const text = isDark ? darkText : t.colors.text;
  const border = isDark ? darkBorder : t.colors.border;
  const shadow = isDark ? darkShadow : t.colors.shadow;
  const neutral = isDark ? darkNeutral : t.colors.neutral;

  const vars: Record<string, string> = {
    '--font-sans': `'${t.fonts.sans}', system-ui, sans-serif`,
    '--font-display': `'${t.fonts.display}', '${t.fonts.sans}', system-ui, sans-serif`,
    '--font-mono': `'${t.fonts.mono}', ui-monospace, monospace`,
    '--radius-sm': t.radius.sm,
    '--radius-md': t.radius.md,
    '--radius-lg': t.radius.lg,
    '--radius-xl': t.radius.xl,

    '--color-brand-blue': brand.blue,
    '--color-brand-sky': brand.sky,
    '--color-brand-yellow': brand.yellow,
    '--color-brand-orange': brand.orange,
    '--color-brand-red': brand.red,
    '--color-brand-green': brand.green,

    '--color-primary': isDark ? '#3b82f6' : t.colors.primary[500],
    '--color-primary-hover': isDark ? '#60a5fa' : t.colors.primary[600],
    '--color-primary-soft': isDark ? '#1e3a5f' : t.colors.primary[50],
    '--color-secondary': t.colors.secondary[500],
    '--color-accent-yellow': t.colors.accent.yellow,
    '--color-accent-orange': t.colors.accent.orange,
    '--color-accent-red': t.colors.accent.red,
    '--color-accent-green': t.colors.accent.green,

    '--color-surface-page': surface.page,
    '--color-surface-card': surface.card,
    '--color-surface-muted': surface.muted,
    '--color-surface-soft': surface.soft,
    '--color-ink': text.primary,
    '--color-line': border.default,
    '--gradient-hero': surface.hero,

    '--color-text-primary': text.primary,
    '--color-text-secondary': text.secondary,
    '--color-text-muted': text.muted,
    '--color-text-inverse': text.inverse,
    '--color-text-link': text.link,
    '--color-text-link-hover': text.linkHover,

    '--color-border': border.default,
    '--color-border-strong': border.strong,
    '--color-border-focus': border.focus,

    '--color-success': t.colors.semantic.success,
    '--color-warning': t.colors.semantic.warning,
    '--color-error': t.colors.semantic.error,
    '--color-info': t.colors.semantic.info,

    '--shadow-sm': shadow.sm,
    '--shadow-md': shadow.md,
    '--shadow-lg': shadow.lg,

    '--color-shop-bg': isDark ? '#0b1220' : '#F8F9FC',
    '--color-shop-card': isDark ? '#121a2b' : '#ffffff',
    '--color-shop-muted': isDark ? '#1a2438' : '#F8F9FC',
    '--color-shop-border': isDark ? '#2a3548' : '#e5e7eb',
    '--color-shop-text': isDark ? '#f1f5f9' : '#111827',
    '--color-shop-muted-text': isDark ? '#94a3b8' : '#6b7280',
    '--color-shop-icon-bg': isDark ? '#1a2438' : '#F1F2F6',

    '--gradient-brand-stripe': `linear-gradient(90deg, ${brand.blue} 0%, ${brand.sky} 20%, ${brand.yellow} 40%, ${brand.orange} 60%, ${brand.red} 80%, ${brand.green} 100%)`,
  };

  Object.entries(t.colors.primary).forEach(([k, v]) => {
    vars[`--color-primary-${k}`] = v as string;
  });
  Object.entries(t.colors.secondary).forEach(([k, v]) => {
    vars[`--color-secondary-${k}`] = v as string;
  });
  Object.entries(neutral).forEach(([k, v]) => {
    vars[`--color-neutral-${k}`] = v as string;
  });

  return vars;
}
