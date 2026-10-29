'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Building2,
  CreditCard,
  Fingerprint,
  Hash,
  Home,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

type LocationHit = {
  display_name: string;
  address_line: string;
  address_locality?: string | null;
  address_state?: string | null;
  address_pincode?: string | null;
  address_country?: string | null;
  latitude: string;
  longitude: string;
};

type Profile = {
  full_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  usos_id?: string;
  referral_code?: string;
  sponsor_referral_code?: string | null;
  sponsor_name?: string | null;
  package_code?: string | null;
  package_name?: string | null;
  kyc_status?: string;
  kyc_rejected_reason?: string | null;
  kyc_submitted_at?: string | null;
  pan_number?: string | null;
  aadhaar_number?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_name?: string | null;
  address_line?: string | null;
  address_locality?: string | null;
  address_state?: string | null;
  address_pincode?: string | null;
  address_country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  location_source?: string | null;
  created_at?: string | null;
  activated_at?: string | null;
  profile_image_url?: string | null;
};

const panelClass = 'rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.045)]';

const softControl =
  'w-full rounded-xl border border-[#e3eaf5] bg-white text-sm text-ink outline-none transition placeholder:text-[#94a3b8] hover:border-[#c5d2e8] focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:border-[#e7edf5] disabled:bg-[#f4f7fb] disabled:text-ink-secondary dark:border-line dark:bg-surface-card dark:placeholder:text-ink-muted dark:disabled:bg-surface-muted';

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function IconTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4d6ef5] dark:bg-primary/15 dark:text-sky">
      {children}
    </span>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
}) {
  const tones = {
    success: 'bg-[#e7f8ef] text-[#149456] dark:bg-green/15 dark:text-green',
    danger: 'bg-[#fdecee] text-[#e25d6a] dark:bg-red/15 dark:text-red',
    warning: 'bg-amber-50 text-amber-700 dark:bg-yellow/15 dark:text-yellow',
    neutral: 'bg-surface-muted text-ink-secondary',
  };
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone])}>
      {children}
    </span>
  );
}

function SectionHead({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <IconTile>{icon}</IconTile>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs leading-snug text-ink-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetaItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className={cn('mt-1 break-words text-sm font-semibold', accent ? 'text-primary' : 'text-ink')}>{value || '—'}</p>
    </div>
  );
}

function SoftField({
  id,
  label,
  icon,
  leading,
  trailing,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  error,
  hint,
  type = 'text',
  inputMode,
  autoComplete,
  multiline,
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  autoComplete?: string;
  multiline?: boolean;
}) {
  const controlClass = cn(softControl, 'h-11 px-3.5', leading && 'pl-10', trailing && 'pr-10', error && 'border-accent-red');
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
        {icon ? <span className="text-ink-muted">{icon}</span> : null}
        {label}
      </span>
      <span className="relative block">
        {leading ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">{leading}</span>
        ) : null}
        {multiline ? (
          <textarea
            id={id}
            rows={2}
            className={cn(controlClass, 'h-auto resize-none py-2.5 leading-snug')}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            className={controlClass}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {trailing ? <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span> : null}
      </span>
      {error ? <span className="mt-1 block text-xs text-accent-red">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-[11px] text-ink-muted">{hint}</span> : null}
    </label>
  );
}

function ProfileArt({ quote }: { quote: string }) {
  return (
    <div className="pointer-events-none relative hidden w-[230px] shrink-0 self-stretch md:block" aria-hidden>
      <svg viewBox="0 0 230 110" className="absolute bottom-0 right-0 h-full w-full">
        <path d="M120 92c28-2 40-28 58-26 14-24 40-12 56-32l6 66H120z" className="fill-[#d9e6fb] dark:fill-white/10" />
        <path d="M150 98c22-18 36-10 50-34 10 14 20 8 34-12l6 50h-90z" className="fill-[#c5d8f8] dark:fill-white/15" />
        <path d="M176 96l16-34 14 20 16-32 14 46h-60z" className="fill-[#b7cff6] dark:fill-white/20" />
        <path
          d="M28 84c34-16 52 6 82-12"
          fill="none"
          stroke="#8eafeb"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        <path d="M106 68l8 6-8 2" fill="none" stroke="#7ea2e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p
        className="absolute right-2 top-1 max-w-[9.5rem] -rotate-6 text-right text-[15px] leading-tight text-[#5a78c8] dark:text-[#b9cff8]"
        style={{ fontFamily: '"Segoe Script", "Segoe Print", cursive' }}
      >
        {quote}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const t = useContent('dashboard').profile;
  const actions = useContent('common').actions;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'personal' | 'location' | 'kyc' | 'bank' | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [addressLine, setAddressLine] = useState('');
  const [locality, setLocality] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationSource, setLocationSource] = useState('');

  const [hits, setHits] = useState<LocationHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyProfile = useCallback((p: Profile) => {
    setProfile(p);
    setName(p.full_name || '');
    setPhone((p.phone || '').replace(/\D/g, '').slice(0, 15));
    setPan(p.pan_number || '');
    setAadhaar(p.aadhaar_number || '');
    setBankName(p.bank_name || '');
    setAccountName(p.bank_account_name || '');
    setAccountNumber(p.bank_account_number || '');
    setIfsc(p.bank_ifsc || '');
    setAddressLine(p.address_line || '');
    setLocality(p.address_locality || '');
    setStateName(p.address_state || '');
    setPincode(p.address_pincode || '');
    setCountry(p.address_country || 'India');
    setLatitude(p.latitude || '');
    setLongitude(p.longitude || '');
    setLocationSource(p.location_source || '');
  }, []);

  useEffect(() => {
    api
      .getMyProfile()
      .then(applyProfile)
      .catch(() => toast.error(t.loadError || 'Could not load profile'))
      .finally(() => setLoading(false));
  }, [applyProfile, t.loadError]);

  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined' || window.location.hash !== '#bank-details') return;
    const timer = window.setTimeout(() => {
      document.getElementById('bank-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [loading]);

  function applyLocation(hit: LocationHit, source: string) {
    setAddressLine(hit.address_line || hit.display_name);
    setLocality(hit.address_locality || '');
    setStateName(hit.address_state || '');
    setPincode(hit.address_pincode || '');
    setCountry(hit.address_country || 'India');
    setLatitude(hit.latitude || '');
    setLongitude(hit.longitude || '');
    setLocationSource(source);
    setHits([]);
  }

  function onAddressChange(value: string) {
    setAddressLine(value);
    setLocationSource(value.trim() ? 'manual' : '');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 3) {
      setHits([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchLocations(value.trim());
        setHits(res.items || []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error(t.geoUnsupported);
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      const hit = await api.reverseGeocode(lat, lng);
      applyLocation(
        {
          display_name: hit.display_name || hit.address_line,
          address_line: hit.address_line || hit.display_name,
          address_locality: hit.address_locality,
          address_state: hit.address_state,
          address_pincode: hit.address_pincode,
          address_country: hit.address_country,
          latitude: hit.latitude || String(lat),
          longitude: hit.longitude || String(lng),
        },
        'current'
      );
      toast.success(t.locationCaptured);
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? t.geoDenied
          : e?.response?.data?.detail || t.geoFailed;
      toast.error(typeof msg === 'string' ? msg : t.geoFailed);
    } finally {
      setLocating(false);
    }
  }

  async function savePersonal(e: FormEvent) {
    e.preventDefault();
    setSaving('personal');
    try {
      const p = await api.patch('/api/v1/users/me', { full_name: name });
      applyProfile(p as Profile);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t.saveFailed);
    } finally {
      setSaving(null);
    }
  }

  async function saveLocation(e: FormEvent) {
    e.preventDefault();
    if (!addressLine.trim()) {
      toast.error(t.addressRequired);
      return;
    }
    setSaving('location');
    try {
      const p = await api.updateMyLocation({
        address_line: addressLine.trim(),
        address_locality: locality.trim() || null,
        address_state: stateName.trim() || null,
        address_pincode: pincode.trim() || null,
        address_country: country.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
        location_source: locationSource || 'manual',
      });
      applyProfile(p);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t.saveFailed);
    } finally {
      setSaving(null);
    }
  }

  async function saveKyc(e: FormEvent) {
    e.preventDefault();
    setSaving('kyc');
    try {
      const p = await api.put('/api/v1/users/me/kyc', {
        pan_number: pan,
        aadhaar_number: aadhaar,
      });
      applyProfile(p as Profile);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t.saveFailed);
    } finally {
      setSaving(null);
    }
  }

  async function saveBank(e: FormEvent) {
    e.preventDefault();
    setSaving('bank');
    try {
      const p = await api.put('/api/v1/users/me/bank', {
        bank_account_name: accountName,
        bank_account_number: accountNumber,
        bank_ifsc: ifsc,
        bank_name: bankName,
      });
      applyProfile(p as Profile);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t.saveFailed);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const packageLabel =
    profile?.package_name && profile?.package_code
      ? `${profile.package_name} (${profile.package_code})`
      : profile?.package_name || profile?.package_code || '—';

  const kycStatus = profile?.kyc_status === 'verified' ? 'approved' : profile?.kyc_status || 'not_submitted';
  const kycLocked = kycStatus === 'approved';
  const kycLabels = (t.status || {
    not_submitted: 'Not submitted',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }) as Record<string, string>;
  const kycTone =
    kycStatus === 'approved' ? 'success' : kycStatus === 'rejected' ? 'danger' : kycStatus === 'pending' ? 'warning' : 'neutral';
  const kycHint = kycLocked
    ? t.kycLocked
    : kycStatus === 'rejected'
      ? t.kycRejectedHint
      : kycStatus === 'pending'
        ? t.kycPendingHint
        : t.kycNotSubmittedHint;

  const displayName = name || user?.name || '—';
  const displayEmail = profile?.email || user?.email || '';
  const placeLabel = [locality, stateName].filter(Boolean).join(', ');
  const sponsorLabel = profile?.sponsor_referral_code
    ? `${profile.sponsor_name || ''} (${profile.sponsor_referral_code})`.trim()
    : t.noSponsor;
  const accountStatusTone = profile?.status === 'active' ? 'success' : profile?.status === 'inactive' ? 'neutral' : 'warning';
  const ctaClass = 'rounded-xl px-4 shadow-[0_8px_16px_rgba(27,82,164,0.22)]';

  return (
    <div className="space-y-4">
      <section className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-[#e4ecf8] bg-[linear-gradient(105deg,#f7faff_0%,#eef3ff_46%,#f4f1ff_100%)] px-5 py-5 dark:border-line dark:bg-[linear-gradient(105deg,rgba(27,82,164,0.28),rgba(90,80,200,0.16))] sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#5b8def] via-[#4f6ef7] to-[#7a5af8] text-white shadow-[0_8px_20px_rgba(79,110,247,0.35)]">
            {profile?.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8" strokeWidth={1.75} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">{displayName}</h1>
              {profile?.status ? <StatusPill tone={accountStatusTone}>{prettyStatus(profile.status)}</StatusPill> : null}
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">{t.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-secondary">
              {displayEmail ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <span className="truncate">{displayEmail}</span>
                </span>
              ) : null}
              {phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  {phone}
                </span>
              ) : null}
              {placeLabel ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <span className="truncate">{placeLabel}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <ProfileArt quote={t.quote} />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className={cn(panelClass, 'h-full')}>
          <SectionHead icon={<User className="h-5 w-5" />} title={t.personalTitle} subtitle={t.personalSubtitle} />
          <form onSubmit={savePersonal} className="mt-5 space-y-3">
            <SoftField
              id="name"
              label={t.fields.name}
              icon={<User className="h-3.5 w-3.5" />}
              leading={<User className="h-4 w-4" />}
              value={name}
              onChange={setName}
              required
            />
            <SoftField
              id="email"
              label={t.fields.email}
              icon={<Mail className="h-3.5 w-3.5" />}
              leading={<Mail className="h-4 w-4" />}
              trailing={<Lock className="h-3.5 w-3.5 text-ink-muted" />}
              value={displayEmail}
              onChange={() => undefined}
              disabled
              hint={t.emailLocked}
            />
            <SoftField
              id="phone"
              label={t.fields.phone}
              icon={<Phone className="h-3.5 w-3.5" />}
              leading={<Phone className="h-4 w-4" />}
              trailing={<Lock className="h-3.5 w-3.5 text-ink-muted" />}
              type="tel"
              value={phone}
              onChange={() => undefined}
              disabled
              hint={t.phoneLocked}
            />
            <Button type="submit" loading={saving === 'personal'} disabled={Boolean(saving)} size="sm" className={ctaClass}>
              <Save className="h-4 w-4" />
              {t.save}
            </Button>
          </form>
        </Card>

        <Card className={cn(panelClass, 'h-full')}>
          <SectionHead
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t.kycTitle}
            subtitle={kycHint}
            action={<StatusPill tone={kycTone}>{kycLabels[kycStatus] || kycStatus}</StatusPill>}
          />
          {kycStatus === 'rejected' && profile?.kyc_rejected_reason ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <p className="font-semibold">{t.rejectedReasonLabel}</p>
              <p className="mt-0.5">{profile.kyc_rejected_reason}</p>
            </div>
          ) : null}
          <form onSubmit={saveKyc} className="mt-4 space-y-3">
            <SoftField
              id="pan"
              label={t.fields.pan}
              icon={<CreditCard className="h-3.5 w-3.5" />}
              leading={<CreditCard className="h-4 w-4" />}
              value={pan}
              onChange={(value) => setPan(value.toUpperCase())}
              placeholder={t.placeholders?.pan}
              disabled={kycLocked}
              required
            />
            <SoftField
              id="aadhaar"
              label={t.fields.aadhaar}
              icon={<Fingerprint className="h-3.5 w-3.5" />}
              leading={<Fingerprint className="h-4 w-4" />}
              value={aadhaar}
              onChange={(value) => setAadhaar(value.replace(/\D/g, '').slice(0, 12))}
              placeholder={t.placeholders?.aadhaar}
              inputMode="numeric"
              disabled={kycLocked}
              required
            />
            <Button type="submit" loading={saving === 'kyc'} disabled={kycLocked || Boolean(saving)} className={cn(ctaClass, 'mt-1 w-full')}>
              <Send className="h-4 w-4" />
              {t.submitKyc || t.save}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        <Card className={cn(panelClass, 'h-full')}>
          <SectionHead
            icon={<Landmark className="h-5 w-5" />}
            title={t.accountTitle}
            subtitle={t.accountSubtitle}
            action={profile?.status ? <StatusPill tone={accountStatusTone}>{prettyStatus(profile.status)}</StatusPill> : null}
          />
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
            <MetaItem label={t.fields.email} value={displayEmail || '—'} />
            <MetaItem label={t.fields.userId} value={profile?.usos_id || '—'} />
            <MetaItem label={t.fields.referralCode} value={profile?.referral_code || '—'} accent />
            <MetaItem label={t.fields.package} value={packageLabel} />
            <MetaItem label={t.fields.sponsor} value={sponsorLabel} />
            <MetaItem label={t.fields.joined} value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
            <MetaItem label={t.fields.activated} value={profile?.activated_at ? formatDate(profile.activated_at) : '—'} />
          </div>
        </Card>
      </div>

      <Card className={cn(panelClass, hits.length > 0 && 'relative z-20')}>
        <SectionHead
          icon={<MapPin className="h-5 w-5" />}
          title={t.locationTitle}
          subtitle={t.locationSubtitle}
          action={
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary disabled:opacity-50"
            >
              {locating ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              ) : (
                <MapPin className="h-3.5 w-3.5" />
              )}
              {t.useCurrentLocation}
            </button>
          }
        />
        <form onSubmit={saveLocation} className="mt-5 space-y-4">
          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-12">
            <div className="relative md:col-span-2 xl:col-span-4">
              <SoftField
                id="addressLine"
                label={t.fields.address}
                icon={<Home className="h-3.5 w-3.5" />}
                value={addressLine}
                onChange={onAddressChange}
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                required
                trailing={
                  <button
                    type="button"
                    className="rounded-md p-1 text-ink-muted hover:text-primary"
                    aria-label={actions.edit}
                    onClick={() => document.getElementById('addressLine')?.focus()}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                }
              />
              {hits.length > 0 ? (
                <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-surface-card shadow-card">
                  {hits.map((hit) => (
                    <li key={`${hit.latitude}-${hit.longitude}-${hit.display_name}`}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
                        onClick={() => applyLocation(hit, 'search')}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{hit.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {searching ? <p className="mt-1 text-[11px] text-ink-muted">{t.searching}</p> : null}
            </div>
            <div className="xl:col-span-2">
              <SoftField
                id="locality"
                label={t.fields.locality}
                icon={<Home className="h-3.5 w-3.5" />}
                value={locality}
                onChange={setLocality}
              />
            </div>
            <div className="xl:col-span-2">
              <SoftField
                id="state"
                label={t.fields.state}
                icon={<Home className="h-3.5 w-3.5" />}
                value={stateName}
                onChange={setStateName}
              />
            </div>
            <div className="xl:col-span-2">
              <SoftField
                id="pincode"
                label={t.fields.pincode}
                icon={<MapPin className="h-3.5 w-3.5" />}
                value={pincode}
                onChange={setPincode}
              />
            </div>
            <div className="xl:col-span-2">
              <SoftField id="country" label={t.fields.country} value={country} onChange={setCountry} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-muted">
              {latitude || longitude
                ? `${t.coordsLabel}: ${latitude}, ${longitude}${locationSource ? ` · ${locationSource}` : ''}`
                : t.searchHint}
            </p>
            <Button type="submit" loading={saving === 'location'} disabled={Boolean(saving)} size="sm" className={ctaClass}>
              <Save className="h-4 w-4" />
              {t.saveLocation}
            </Button>
          </div>
        </form>
      </Card>

      <Card id="bank-details" className={panelClass}>
        <SectionHead
          icon={<Landmark className="h-5 w-5" />}
          title={t.bankTitle}
          subtitle={t.bankSubtitle}
        />
        <form onSubmit={saveBank} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SoftField
              id="accountName"
              label={t.fields.accountName}
              icon={<User className="h-3.5 w-3.5" />}
              value={accountName}
              onChange={setAccountName}
              placeholder={t.placeholders?.accountName}
            />
            <SoftField
              id="bankName"
              label={t.fields.bankName}
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={bankName}
              onChange={setBankName}
              placeholder={t.placeholders?.bankName}
            />
            <SoftField
              id="accountNumber"
              label={t.fields.accountNumber}
              icon={<CreditCard className="h-3.5 w-3.5" />}
              value={accountNumber}
              onChange={setAccountNumber}
              placeholder={t.placeholders?.accountNumber}
            />
            <SoftField
              id="ifsc"
              label={t.fields.ifsc}
              icon={<Hash className="h-3.5 w-3.5" />}
              value={ifsc}
              onChange={(value) => setIfsc(value.toUpperCase())}
              placeholder={t.placeholders?.ifsc}
            />
          </div>
          <Button type="submit" loading={saving === 'bank'} disabled={Boolean(saving)} size="sm" className={ctaClass}>
            <Save className="h-4 w-4" />
            {t.save}
          </Button>
        </form>
      </Card>
    </div>
  );
}
