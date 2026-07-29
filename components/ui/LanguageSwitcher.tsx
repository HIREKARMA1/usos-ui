'use client';

import { useLocale } from '@/hooks/useLocale';
import { useContent } from '@/hooks/useContent';
import { LOCALE_OPTIONS, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export function LanguageSwitcher({
  className,
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const { locale, setLocale } = useLocale();
  const common = useContent('common');
  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border p-1',
        dark ? 'border-white/15 bg-white/[0.06]' : 'border-line bg-white',
        className
      )}
    >
      <span className="sr-only">{common.language.label}</span>
      {LOCALE_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLocale(opt.code as Locale)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
            locale === opt.code
              ? dark
                ? 'bg-sky text-[#0f1622]'
                : 'bg-primary text-white'
              : dark
                ? 'text-white/55 hover:text-white'
                : 'text-ink-muted hover:text-ink'
          )}
          aria-pressed={locale === opt.code}
        >
          {opt.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
