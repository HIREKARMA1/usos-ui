import type { AuthUser } from '@/types';

export const PAYMENT_PATH = '/payment';
export const PAYMENT_GATE_COOKIE = 'usos_payment_gate';
export const ACTIVATION_MESSAGE =
  'Your account is ready to use. You can explore and purchase products. Activate your account to unlock reward benefits.';
export const ACTIVATION_REQUIRED_MESSAGE = 'Activate your account to unlock reward benefits.';

/** True when a member still needs the activation payment. Admins are never gated. */
export function needsActivation(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return false;
  return user.status !== 'active';
}

/** @deprecated Use needsActivation. Kept so older call sites keep the same meaning. */
export function needsPayment(user: AuthUser | null | undefined): boolean {
  return needsActivation(user);
}

export function canAccessRewards(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.status === 'active';
}

export function postAuthPath(user: AuthUser): string {
  return user.role === 'admin' ? '/admin' : '/user';
}

/** Clear the old payment wall cookie. Activation no longer blocks site access. */
export function persistPaymentGateCookie(user: AuthUser | null): void {
  if (typeof document === 'undefined') return;
  if (!user) {
    document.cookie = `${PAYMENT_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${PAYMENT_GATE_COOKIE}=ok; path=/; max-age=31536000; SameSite=Lax`;
}

export function isActivationRequiredError(error: unknown): boolean {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (detail && typeof detail === 'object') {
    const code = (detail as { code?: string }).code;
    return code === 'ACTIVATION_REQUIRED' || code === 'PAYMENT_REQUIRED';
  }
  return typeof detail === 'string' && (detail.includes('ACTIVATION_REQUIRED') || detail.includes('PAYMENT_REQUIRED'));
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message?: string }).message || fallback);
  }
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : '')).filter(Boolean).join(', ') || fallback;
  }
  return fallback;
}
