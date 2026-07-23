'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import type { CredentialResponse } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api, roleHome } from '@/lib/api';
import { env } from '@/lib/constants';
import { PayUCheckoutForm } from './PayUCheckoutForm';
import { GoogleSignInButton } from './GoogleSignInButton';
import Link from 'next/link';
import type { PaymentOrder, TokenResponse } from '@/types';

export function LoginForm() {
  const t = useContent('auth').login;
  const pay = useContent('auth').payment;
  const v = useContent('auth').validation;
  const { loginSuccess } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get('next') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null);
  const googleEnabled = Boolean(env.googleClientId.trim());

  function afterLoginDestination(role: TokenResponse['role']) {
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      return nextPath;
    }
    return roleHome(role);
  }

  async function finishAuth(res: TokenResponse) {
    loginSuccess(res.access_token, res.user);
    if (res.user.status === 'pending') {
      toast.success(t.resumePayment || pay.redirecting);
      const order = await api.createPaymentOrder();
      setCheckout(order);
      return;
    }
    toast.success(t.success);
    router.push(afterLoginDestination(res.role));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = v.identifierRequired;
    if (!password) next.password = v.passwordRequired;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      await finishAuth(res);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg).join(', ')
            : t.error;
      toast.error(msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle(response: CredentialResponse) {
    if (!response.credential) {
      toast.error(t.googleError || t.error);
      return;
    }
    setLoading(true);
    try {
      const res = await api.googleAuth({ id_token: response.credential });
      await finishAuth(res);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : t.googleError || t.error);
    } finally {
      setLoading(false);
    }
  }

  if (checkout) {
    return (
      <Card className="w-full max-w-md">
        <p className="section-eyebrow">{pay.eyebrow}</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{pay.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{pay.subtitle}</p>
        <p className="mt-4 text-sm text-ink-muted">{pay.redirecting}</p>
        <PayUCheckoutForm action={checkout.action} fields={checkout.fields} buttonLabel={pay.manualButton} />
        <p className="mt-4 text-center text-xs text-ink-muted">{pay.securedBy}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <p className="section-eyebrow">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{t.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>

      {googleEnabled ? (
        <div className="mt-6 space-y-3">
          <GoogleSignInButton
            label={t.continueGoogle || 'Continue with Google'}
            onSuccess={onGoogle}
            onError={() => toast.error(t.googleError || t.error)}
            disabled={loading}
          />
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            <span>{t.orEmail || 'or continue with email'}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-muted">
          {t.configureGoogle || 'Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google Sign-In.'}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Input
          id="email"
          label={t.identifierLabel}
          placeholder={t.identifierPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="username"
        />
        <PasswordInput
          id="password"
          label={t.passwordLabel}
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full" loading={loading}>
          {loading ? t.submitting : t.submit}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t.noAccount}{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {t.registerLink}
        </Link>
      </p>
    </Card>
  );
}
