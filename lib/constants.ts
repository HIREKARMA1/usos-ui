export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
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
export type PackageId = (typeof PACKAGE_IDS)[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
