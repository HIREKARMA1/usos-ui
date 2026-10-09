'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { CredentialResponse } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { env } from '@/lib/constants';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { PackagePlan, TokenResponse } from '@/types';
import styles from './AuthForm.module.css';

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
  const [packageCode, setPackageCode] = useState(
    () => (search.get('package') || packagesContent.items[0]?.id || '').toString()
  );
  const [sponsor, setSponsor] = useState(refFromLink);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiPackages, setApiPackages] = useState<PackagePlan[]>([]);
  const [packageOpen, setPackageOpen] = useState(false);
  const packageSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (refFromLink) setSponsor(refFromLink);
  }, [refFromLink]);

  useEffect(() => {
    if (!packageOpen) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = packageSelectRef.current;
      if (el && !el.contains(e.target as Node)) setPackageOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPackageOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [packageOpen]);

  useEffect(() => {
    api
      .getPackages()
      .then((pkgs) => {
        setApiPackages(pkgs);
        const requested = (search.get('package') || '').trim();
        const match = pkgs.find((p) => p.code === requested || p.id === requested);
        setPackageCode((current: string) => {
          if (match) return match.code;
          if (current && pkgs.some((p) => p.code === current)) return current;
          return pkgs[0]?.code || current;
        });
      })
      .catch(() => undefined);
  }, [search]);

  const packageOptions: { value: string; label: string }[] = (
    apiPackages.length ? apiPackages : packagesContent.items
  ).map((p: { code?: string; id?: string; name: string; price: number | string }) => ({
    value: String(p.code || p.id),
    label: `${p.name} — ₹${p.price}`,
  }));
  const selectedPackageLabel =
    packageOptions.find((o) => o.value === packageCode)?.label || packageOptions[0]?.label || 'Select package';

  function sponsorCode() {
    return (sponsorLocked ? refFromLink : sponsor.trim().toUpperCase()) || undefined;
  }

  function goToPayment(res: TokenResponse, message: string) {
    loginSuccess(res.access_token, res.user);
    toast.success(message);
    router.push('/payment');
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
    <div className={styles.card}>
      <p className={styles.eyebrow}>{t.eyebrow}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.subtitle}>{t.subtitle}</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              id="phone"
              label={t.phoneLabel}
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel} id="package-label">
              {t.packageLabel}
            </span>
            <div
              className={`${styles.softSelect} ${packageOpen ? styles.softSelectOpen : ''}`}
              ref={packageSelectRef}
            >
              <button
                type="button"
                id="package"
                className={styles.softSelectTrigger}
                aria-haspopup="listbox"
                aria-expanded={packageOpen}
                aria-labelledby="package-label"
                onClick={() => setPackageOpen((open) => !open)}
              >
                <span className={styles.softSelectValue}>{selectedPackageLabel}</span>
                <ChevronDown className={styles.softSelectChevron} aria-hidden />
              </button>
              {packageOpen ? (
                <ul className={styles.softSelectMenu} role="listbox" aria-labelledby="package-label">
                  {packageOptions.map((option) => {
                    const active = option.value === packageCode;
                    return (
                      <li key={option.value} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={`${styles.softSelectOption} ${active ? styles.softSelectOptionActive : ''}`}
                          onClick={() => {
                            setPackageCode(option.value);
                            setPackageOpen(false);
                            if (errors.package) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.package;
                                return next;
                              });
                            }
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
            {errors.package ? <span className={styles.fieldError}>{errors.package}</span> : null}
          </div>

          <div className={styles.field}>
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

          {googleEnabled && (
            <div>
              <GoogleSignInButton
                label={t.continueGoogle || 'Continue with Google'}
                onSuccess={onGoogle}
                onError={() => toast.error(t.googleError || t.error)}
                disabled={loading}
              />
              <p className={styles.googleHint}>{t.googleHint}</p>
              <div className={styles.divider}>
                {t.orEmail || 'or register with email'}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <Input
              id="name"
              label={t.nameLabel}
              placeholder={t.namePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.name}
            />
          </div>

          <div className={styles.field}>
            <Input
              id="email"
              label={t.emailLabel}
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
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
              autoComplete="new-password"
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
          <p className={styles.terms}>{t.terms}</p>
        </div>
      </form>

      <p className={styles.footer}>
        {t.haveAccount}{' '}
        <Link href="/login">{t.loginLink}</Link>
      </p>
    </div>
  );
}
