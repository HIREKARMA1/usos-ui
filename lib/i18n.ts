import { LOCALE_KEY, env } from './constants';

import enCommon from '@/content/en/common.json';
import enAuth from '@/content/en/auth.json';
import enDashboard from '@/content/en/dashboard.json';
import enAdmin from '@/content/en/admin.json';
import enLanding from '@/content/en/landing.json';
import enPackages from '@/content/en/packages.json';

import hiCommon from '@/content/hi/common.json';
import hiAuth from '@/content/hi/auth.json';
import hiDashboard from '@/content/hi/dashboard.json';
import hiAdmin from '@/content/hi/admin.json';
import hiLanding from '@/content/hi/landing.json';
import hiPackages from '@/content/hi/packages.json';

import orCommon from '@/content/or/common.json';
import orAuth from '@/content/or/auth.json';
import orDashboard from '@/content/or/dashboard.json';
import orAdmin from '@/content/or/admin.json';
import orLanding from '@/content/or/landing.json';
import orPackages from '@/content/or/packages.json';

export type Locale = 'en' | 'hi' | 'or';

export const LOCALES: Locale[] = ['en', 'hi', 'or'];

export const LOCALE_OPTIONS: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
];

export type ContentNamespace =
  | 'common'
  | 'auth'
  | 'dashboard'
  | 'admin'
  | 'landing'
  | 'packages';

export type ContentTree = Record<string, any>;

const bundles: Record<Locale, Record<ContentNamespace, ContentTree>> = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    admin: enAdmin,
    landing: enLanding,
    packages: enPackages,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    dashboard: hiDashboard,
    admin: hiAdmin,
    landing: hiLanding,
    packages: hiPackages,
  },
  or: {
    common: orCommon,
    auth: orAuth,
    dashboard: orDashboard,
    admin: orAdmin,
    landing: orLanding,
    packages: orPackages,
  },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && LOCALES.includes(value as Locale);
}

export function getDefaultLocale(): Locale {
  return isLocale(env.defaultLocale) ? env.defaultLocale : 'en';
}

export function getNamespace(locale: Locale, namespace: ContentNamespace): ContentTree {
  return bundles[locale]?.[namespace] ?? bundles.en[namespace];
}

export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return getDefaultLocale();
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return isLocale(stored) ? stored : getDefaultLocale();
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_KEY, locale);
  document.cookie = `${LOCALE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

export function localeDateTag(locale: Locale): string {
  switch (locale) {
    case 'hi':
      return 'hi-IN';
    case 'or':
      return 'or-IN';
    default:
      return 'en-IN';
  }
}
