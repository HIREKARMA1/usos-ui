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
import { saveSession } from '@/lib/auth';
import { env } from '@/lib/constants';
import { PayUCheckoutForm } from './PayUCheckoutForm';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { PackagePlan, PaymentOrder, TokenResponse } from '@/types';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type Props = {
  embedded?: boolean;
  initialPackage?: string;
  initialRef?: string;
  onSwitchMode?: () => void;
  onClose?: () => void;
};

const darkField =
  'border-white/15 bg-white/5 text-white placeholder:text-white/35 [&_option]:bg-[#0f1622] [&_option]:text-white';
const darkLabel = 'text-white/80';
const darkHint = 'text-white/45';

export function RegisterForm({
  embedded,
  initialPackage,
  initialRef,
  onSwitchMode,
  onClose,
}: Props) {
  const t = useContent('auth').register;
  const pay = useContent('auth').payment;
  const v = useContent('auth').validation;
  const packagesContent = useContent('packages');
  const search = useSearchParams();
  const router = useRouter();
  const { loginSuccess } = useAuth();

  const refFromLink = (initialRef || search.get('ref') || '').trim().toUpperCase();
  const sponsorLocked = Boolean(refFromLink);
  const googleEnabled = Boolean(env.googleClientId.trim());

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [packageCode, setPackageCode] = useState(initialPackage || 'A');
  const [sponsor, setSponsor] = useState(refFromLink);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null);
  const [apiPackages, setApiPackages] = useState<PackagePlan[]>([]);

  useEffect(() => {
    if (refFromLink) setSponsor(refFromLink);
  }, [refFromLink]);

  useEffect(() => {
    if (initialPackage) setPackageCode(initialPackage);
  }, [initialPackage]);

  useEffect(() => {
    api.getPackages().then(setApiPackages).catch(() => undefined);
  }, []);

  useEffect(() => {
    const status = search.get('payment');
    if (status === 'success') {
      toast.success(pay.redirecting);
      onClose?.();
      router.push('/user');
    } else if (status === 'failed') {
      toast.error(search.get('message') || pay.error);
    }
  }, [search, pay, router, onClose]);

  const packageOptions = (apiPackages.length ? apiPackages : packagesContent.items).map((p: any) => ({
    value: p.id || p.code,
    label: `${p.name} — ₹${p.price}`,
  }));

  function sponsorCode() {
    return (sponsorLocked ? refFromLink : sponsor.trim().toUpperCase()) || undefined;
  }

  async function goToPayU(res: TokenResponse, message: string) {
    loginSuccess(res.access_token, res.user);
    saveSession(res.access_token, res.user);
    toast.success(message);
    const order = await api.createPaymentOrder();
    setCheckout(order);
  }

  async function startPayU(message: string) {
    const tokens = await api.login(email.trim(), password);
    await goToPayU(tokens, message);
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
      await goToPayU(res, t.success);
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
      await startPayU(resumed ? t.resumePayment || t.success : t.success);
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

  const shellClass = embedded
    ? 'w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white'
    : 'w-full max-w-lg';

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

      <form onSubmit={onSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="phone"
            label={t.phoneLabel}
            placeholder={t.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            className={embedded ? darkField : undefined}
            labelClassName={embedded ? darkLabel : undefined}
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
            className={embedded ? darkField : undefined}
            labelClassName={embedded ? darkLabel : undefined}
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
            className={embedded ? darkField : undefined}
            labelClassName={embedded ? darkLabel : undefined}
            hintClassName={embedded ? darkHint : undefined}
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
            <p className={cn('text-xs', embedded ? 'text-white/45' : 'text-ink-muted')}>{t.googleHint}</p>
            <div className={cn('flex items-center gap-3 text-xs', embedded ? 'text-white/45' : 'text-ink-muted')}>
              <span className={cn('h-px flex-1', embedded ? 'bg-white/15' : 'bg-line')} />
              <span>{t.orEmail || 'or register with email'}</span>
              <span className={cn('h-px flex-1', embedded ? 'bg-white/15' : 'bg-line')} />
            </div>
          </div>
        ) : (
          <p
            className={cn(
              'sm:col-span-2 rounded-lg px-3 py-2 text-xs',
              embedded ? 'bg-white/5 text-white/55' : 'bg-surface-muted text-ink-muted'
            )}
          >
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
            className={embedded ? darkField : undefined}
            labelClassName={embedded ? darkLabel : undefined}
          />
        </div>
        <Input
          id="email"
          label={t.emailLabel}
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          className={embedded ? darkField : undefined}
          labelClassName={embedded ? darkLabel : undefined}
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
            className={embedded ? darkField : undefined}
            labelClassName={embedded ? darkLabel : undefined}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" loading={loading} variant="accent">
            {loading ? t.submitting : t.submit}
          </Button>
          <p className={cn('mt-3 text-xs', embedded ? 'text-white/45' : 'text-ink-muted')}>{t.terms}</p>
        </div>
      </form>
      <p className={cn('mt-5 text-center text-sm', embedded ? 'text-white/55' : 'text-ink-muted')}>
        {t.haveAccount}{' '}
        {onSwitchMode ? (
          <button type="button" onClick={onSwitchMode} className="font-semibold text-sky hover:underline">
            {t.loginLink}
          </button>
        ) : (
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t.loginLink}
          </Link>
        )}
      </p>
    </>
  );
}
