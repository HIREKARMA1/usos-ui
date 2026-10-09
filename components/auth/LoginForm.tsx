'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { CredentialResponse } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { env } from '@/lib/constants';
import { needsPayment, postAuthPath } from '@/lib/access';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { TokenResponse } from '@/types';
import styles from './AuthForm.module.css';

export function LoginForm() {
  const t = useContent('auth').login;
  const v = useContent('auth').validation;
  const { loginSuccess } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get('next') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const googleEnabled = Boolean(env.googleClientId.trim());

  function afterLoginDestination(user: TokenResponse['user']) {
    if (!needsPayment(user) && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      return nextPath;
    }
    return postAuthPath(user);
  }

  function finishAuth(res: TokenResponse) {
    loginSuccess(res.access_token, res.user);
    if (needsPayment(res.user)) {
      toast.success(t.resumePayment);
      router.push('/payment');
      return;
    }
    toast.success(t.success);
    router.push(afterLoginDestination(res.user));
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
      finishAuth(res);
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
      finishAuth(res);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : t.googleError || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{t.eyebrow}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.subtitle}>{t.subtitle}</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.fields}>
          {googleEnabled && (
            <div>
              <GoogleSignInButton
                label={t.continueGoogle || 'Continue with Google'}
                onSuccess={onGoogle}
                onError={() => toast.error(t.googleError || t.error)}
                disabled={loading}
              />
              <div className={styles.divider}>
                {t.orEmail || 'or continue with email'}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <Input
              id="email"
              label={t.identifierLabel}
              placeholder={t.identifierPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <PasswordInput
              id="password"
              label={t.passwordLabel}
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={loading}>
            <span className={styles.submitLabel}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </span>
          </button>
        </div>
      </form>

      <p className={styles.footer}>
        {t.noAccount}{' '}
        <Link href="/register">{t.registerLink}</Link>
      </p>
    </div>
  );
}
