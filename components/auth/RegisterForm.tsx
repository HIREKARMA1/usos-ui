'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { CredentialResponse } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { env } from '@/lib/constants';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { PackagePlan, TokenResponse } from '@/types';

export function RegisterForm() {
  const t = useContent('auth').register;
  const v = useContent('auth').validation;
  const packagesContent = useContent('packages');
  const search = useSearchParams();
  const router = useRouter();
  const { loginSuccess } = useAuth();

  const refFromLink = (search.get('ref') || '').trim().toUpperCase();
  const sponsorLocked = Boolean(refFromLink);
  const googleEnabled = Boolean(env.googleClientId.trim());

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [packageCode, setPackageCode] = useState('A');
  const [sponsor, setSponsor] = useState(refFromLink);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiPackages, setApiPackages] = useState<PackagePlan[]>([]);

  useEffect(() => {
    if (refFromLink) setSponsor(refFromLink);
  }, [refFromLink]);

  useEffect(() => {
    api.getPackages().then(setApiPackages).catch(() => undefined);
  }, []);

  const packageOptions = (apiPackages.length ? apiPackages : packagesContent.items).map((p: any) => ({
    value: p.id || p.code,
    label: `${p.name} — ₹${p.price}`,
  }));

  function sponsorCode() {
    return (sponsorLocked ? refFromLink : sponsor.trim().toUpperCase()) || undefined;
  }

  function goToPayment(res: TokenResponse, message: string) {
    loginSuccess(res.access_token, res.user);
    toast.success(message);
    router.push('/payment?autostart=1');
  }

  async function startPayment(message: string) {
    const tokens = await api.login(email.trim(), password);
    goToPayment(tokens, message);
  }

  function validateForGoogle(): boolean {
    const next: Record<string, string> = {};
    if (!/^\d{10,15}$/.test(phone)) next.phone = v.phoneInvalid;
    if (!packageCode) next.package = v.packageRequired;
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error(t.googleNeedFields || 'Enter phone and select a package before Google Sign-Up.');
      return false;
    }
    return true;
  }

  async function onGoogle(response: CredentialResponse) {
    if (!response.credential) {
      toast.error(t.googleError || t.error);
      return;
    }
    if (!validateForGoogle()) return;
    setLoading(true);
    try {
      const res = await api.googleAuth({
        id_token: response.credential,
        phone,
        package_code: packageCode,
        sponsor_referral_code: sponsorCode(),
        full_name: fullName.trim() || undefined,
      });
      goToPayment(res, t.success);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : t.googleError || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.name = v.nameRequired;
    if (!email.trim()) next.email = v.emailRequired;
    if (!/^\d{10,15}$/.test(phone)) next.phone = v.phoneInvalid;
    if (password.length < 8) next.password = v.passwordMin;
    if (!packageCode) next.package = v.packageRequired;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const payload: {
        full_name: string;
        email: string;
        phone: string;
        password: string;
        package_code: string;
        sponsor_referral_code?: string;
      } = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone,
        password,
        package_code: packageCode,
      };
      const code = sponsorCode();
      if (code) payload.sponsor_referral_code = code;
      const registered = await api.register(payload);
      const resumed = Boolean((registered as { resumed?: boolean })?.resumed);
      await startPayment(resumed ? t.resumePayment || t.success : t.success);
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

  return (
    <Card className="w-full max-w-lg">
      <p className="section-eyebrow">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{t.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="phone"
            label={t.phoneLabel}
            placeholder={t.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />
        </div>
        <div className="sm:col-span-2">
          <Select
            id="package"
            label={t.packageLabel}
            options={packageOptions}
            value={packageCode}
            onChange={(e) => setPackageCode(e.target.value)}
            error={errors.package}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            id="sponsor"
            label={sponsorLocked ? t.sponsorLabelLocked || t.sponsorLabel : t.sponsorLabel}
            placeholder={t.sponsorPlaceholder}
            hint={sponsorLocked ? t.sponsorHintLocked : t.sponsorHint}
            value={sponsor}
            onChange={(e) => {
              if (!sponsorLocked) setSponsor(e.target.value);
            }}
            readOnly={sponsorLocked}
            error={errors.sponsor}
          />
        </div>

        {googleEnabled ? (
          <div className="sm:col-span-2 space-y-3">
            <GoogleSignInButton
              label={t.continueGoogle || 'Continue with Google'}
              onSuccess={onGoogle}
              onError={() => toast.error(t.googleError || t.error)}
              disabled={loading}
            />
            <p className="text-xs text-ink-muted">{t.googleHint}</p>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-line" />
              <span>{t.orEmail || 'or register with email'}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </div>
        ) : (
          <p className="sm:col-span-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-muted">
            {t.configureGoogle || 'Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google Sign-Up.'}
          </p>
        )}

        <div className="sm:col-span-2">
          <Input
            id="name"
            label={t.nameLabel}
            placeholder={t.namePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.name}
          />
        </div>
        <Input
          id="email"
          label={t.emailLabel}
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div className="sm:col-span-2">
          <PasswordInput
            id="password"
            label={t.passwordLabel}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? t.submitting : t.submit}
          </Button>
          <p className="mt-3 text-xs text-ink-muted">{t.terms}</p>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t.haveAccount}{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t.loginLink}
        </Link>
      </p>
    </Card>
  );
}
