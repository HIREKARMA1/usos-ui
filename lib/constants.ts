const configuredApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function isLoopback(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isPrivateLan(host: string): boolean {
  return (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

/**
 * This PC should call the API on IPv4 loopback. A phone opens the site by LAN IP,
 * and 127.0.0.1 on that phone is the phone itself, so registration never reaches
 * this machine. Use the same host the page was opened on, with the API port.
 */
export function resolveApiUrl(): string {
  const localApi = 'http://127.0.0.1:8000';
  let configured: URL;
  try {
    configured = new URL(configuredApiUrl);
  } catch {
    return localApi;
  }
  if (configured.hostname === 'localhost') configured.hostname = '127.0.0.1';
  // A public https URL with no port is 443. Forcing :8000 makes production
  // call a port that is not open on the internet.
  const isLocalApi = isLoopback(configured.hostname) || isPrivateLan(configured.hostname);
  const port = configured.port || (isLocalApi ? '8000' : '');
  const origin = port
    ? `${configured.protocol}//${configured.hostname}:${port}`
    : configured.origin;

  if (typeof window === 'undefined') return origin;

  const pageHost = window.location.hostname;
  if (isLoopback(pageHost)) return `http://127.0.0.1:${port || '8000'}`;
  if (isPrivateLan(pageHost)) return `http://${pageHost}:${port || '8000'}`;
  return origin;
}

export const env = {
  get apiUrl() {
    return resolveApiUrl();
  },
  appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  defaultLocale: process.env.DEFAULT_LOCALE || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
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
