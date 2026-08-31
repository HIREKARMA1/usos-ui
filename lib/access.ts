import type { AuthUser } from '@/types';

export const PAYMENT_PATH = '/payment';
export const PAYMENT_GATE_COOKIE = 'usos_payment_gate';
export const PAYMENT_PENDING_MESSAGE =
  'Your account activation is pending. Please complete payment to continue.';

export function needsPayment(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return false;
  return user.status !== 'active';
}

export function postAuthPath(user: AuthUser): string {
  if (needsPayment(user)) return PAYMENT_PATH;
  return user.role === 'admin' ? '/admin' : '/user';
}

export function persistPaymentGateCookie(user: AuthUser | null): void {
  if (typeof document === 'undefined') return;
  if (!user) {
    document.cookie = `${PAYMENT_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  const value = needsPayment(user) ? 'pending' : 'ok';
  document.cookie = `${PAYMENT_GATE_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function isPaymentRequiredError(error: unknown): boolean {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (detail && typeof detail === 'object' && (detail as { code?: string }).code === 'PAYMENT_REQUIRED') {
    return true;
  }
  return typeof detail === 'string' && detail.includes('PAYMENT_REQUIRED');
}
