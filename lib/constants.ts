/** Use the page host when the app is opened from a phone via the PC's LAN IP. */
export function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  if (typeof window === 'undefined') return configured;
  try {
    const url = new URL(configured);
    const pageHost = window.location.hostname;
    const apiIsLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1';
    if (apiIsLocal && !pageIsLocal) {
      url.hostname = pageHost;
      return url.origin;
    }
  } catch {
    return configured;
  }
  return configured;
}

export const env = {
  apiUrl: resolveApiUrl(),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
} as const;

export const TOKEN_KEY = 'usos_access_token';
export const USER_KEY = 'usos_user';
export const LOCALE_KEY = 'usos_locale';

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  userDashboard: '/user',
  adminDashboard: '/admin',
  payment: '/payment',
} as const;

export const BINARY_SIDES = ['left', 'right'] as const;
export type BinarySide = (typeof BINARY_SIDES)[number];

export const PACKAGE_IDS = ['A', 'B'] as const;
export type PackageId = string;

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
