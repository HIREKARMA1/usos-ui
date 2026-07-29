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
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type Props = {
  embedded?: boolean;
  nextPath?: string;
  onSwitchMode?: () => void;
  onClose?: () => void;
};

export function LoginForm({ embedded, nextPath: nextProp, onSwitchMode, onClose }: Props) {
  const t = useContent('auth').login;
  const pay = useContent('auth').payment;
  const v = useContent('auth').validation;
  const { loginSuccess } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = nextProp || search.get('next') || '';
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
    onClose?.();
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

  const shellClass = embedded
    ? 'w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white'
    : 'w-full max-w-md';

  const wrap = (children: ReactNode) =>
    embedded ? <div className={shellClass}>{children}</div> : <Card className={shellClass}>{children}</Card>;

  if (checkout) {
    return wrap(
      <>
        <p className={cn('section-eyebrow', embedded && '!text-sky')}>{pay.eyebrow}</p>
        <h1 className={cn('mt-2 text-2xl font-bold tracking-tight', embedded ? 'text-white' : 'text-ink')}>
          {pay.title}
        </h1>
        <p className={cn('mt-1 text-sm', embedded ? 'text-white/65' : 'text-ink-muted')}>{pay.subtitle}</p>
        <p className={cn('mt-4 text-sm', embedded ? 'text-white/65' : 'text-ink-muted')}>{pay.redirecting}</p>
        <PayUCheckoutForm action={checkout.action} fields={checkout.fields} buttonLabel={pay.manualButton} />
        <p className={cn('mt-4 text-center text-xs', embedded ? 'text-white/45' : 'text-ink-muted')}>
          {pay.securedBy}
        </p>
      </>
    );
  }

  return wrap(
    <>
      {!embedded ? (
        <>
          <p className="section-eyebrow">{t.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
        </>
      ) : (
        <h2 className="text-lg font-bold tracking-tight text-white">{t.title}</h2>
      )}

      {googleEnabled ? (
        <div className="mt-5 space-y-3">
          <GoogleSignInButton
            label={t.continueGoogle || 'Continue with Google'}
            onSuccess={onGoogle}
            onError={() => toast.error(t.googleError || t.error)}
            disabled={loading}
          />
          <div className={cn('flex items-center gap-3 text-xs', embedded ? 'text-white/45' : 'text-ink-muted')}>
            <span className={cn('h-px flex-1', embedded ? 'bg-white/15' : 'bg-line')} />
            <span>{t.orEmail || 'or continue with email'}</span>
            <span className={cn('h-px flex-1', embedded ? 'bg-white/15' : 'bg-line')} />
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'mt-4 rounded-lg px-3 py-2 text-xs',
            embedded ? 'bg-white/5 text-white/55' : 'bg-surface-muted text-ink-muted'
          )}
        >
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
          className={embedded ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35' : undefined}
          labelClassName={embedded ? 'text-white/80' : undefined}
        />
        <PasswordInput
          id="password"
          label={t.passwordLabel}
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          className={embedded ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35' : undefined}
          labelClassName={embedded ? 'text-white/80' : undefined}
        />
        <Button type="submit" className="w-full" loading={loading}>
          {loading ? t.submitting : t.submit}
        </Button>
      </form>
      <p className={cn('mt-5 text-center text-sm', embedded ? 'text-white/55' : 'text-ink-muted')}>
        {t.noAccount}{' '}
        {onSwitchMode ? (
          <button type="button" onClick={onSwitchMode} className="font-semibold text-sky hover:underline">
            {t.registerLink}
          </button>
        ) : (
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t.registerLink}
          </Link>
        )}
      </p>
    </>
  );
}
