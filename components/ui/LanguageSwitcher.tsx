'use client';

import { useLocale } from '@/hooks/useLocale';
import { useContent } from '@/hooks/useContent';
import { LOCALE_OPTIONS, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const common = useContent('common');

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1', className)}>
      <span className="sr-only">{common.language.label}</span>
      {LOCALE_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLocale(opt.code as Locale)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition',
            locale === opt.code ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'
          )}
          aria-pressed={locale === opt.code}
        >
          {opt.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
