import themeConfig from './theme.config.js';

export const theme = themeConfig;

export type Theme = typeof theme;

export function themeToCssVariables(t: Theme = theme): Record<string, string> {
  const { brand } = t;
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

    '--color-primary': t.colors.primary[500],
    '--color-primary-hover': t.colors.primary[600],
    '--color-primary-soft': t.colors.primary[50],
    '--color-secondary': t.colors.secondary[500],
    '--color-accent-yellow': t.colors.accent.yellow,
    '--color-accent-orange': t.colors.accent.orange,
    '--color-accent-red': t.colors.accent.red,
    '--color-accent-green': t.colors.accent.green,

    '--color-surface-page': t.colors.surface.page,
    '--color-surface-card': t.colors.surface.card,
    '--color-surface-muted': t.colors.surface.muted,
    '--color-surface-soft': t.colors.surface.soft,
    '--color-surface-ink': t.colors.surface.ink || '#0f1622',
    '--color-ink': t.colors.text.primary,
    '--color-line': t.colors.border.default,
    '--gradient-hero': t.colors.surface.hero,

    '--color-text-primary': t.colors.text.primary,
    '--color-text-secondary': t.colors.text.secondary,
    '--color-text-muted': t.colors.text.muted,
    '--color-text-inverse': t.colors.text.inverse,
    '--color-text-link': t.colors.text.link,
    '--color-text-link-hover': t.colors.text.linkHover,

    '--color-border': t.colors.border.default,
    '--color-border-strong': t.colors.border.strong,
    '--color-border-focus': t.colors.border.focus,

    '--color-success': t.colors.semantic.success,
    '--color-warning': t.colors.semantic.warning,
    '--color-error': t.colors.semantic.error,
    '--color-info': t.colors.semantic.info,

    '--shadow-sm': t.colors.shadow.sm,
    '--shadow-md': t.colors.shadow.md,
    '--shadow-lg': t.colors.shadow.lg,

    '--gradient-brand-stripe': `linear-gradient(90deg, transparent 0%, ${brand.blue} 20%, ${brand.sky} 50%, ${brand.blue} 80%, transparent 100%)`,
  };

  Object.entries(t.colors.primary).forEach(([k, v]) => {
    vars[`--color-primary-${k}`] = v as string;
  });
  Object.entries(t.colors.secondary).forEach(([k, v]) => {
    vars[`--color-secondary-${k}`] = v as string;
  });
  Object.entries(t.colors.neutral).forEach(([k, v]) => {
    vars[`--color-neutral-${k}`] = v as string;
  });

  return vars;
}
