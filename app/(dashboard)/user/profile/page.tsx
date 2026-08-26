'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

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
  referral_code?: string;
  sponsor_referral_code?: string | null;
  sponsor_name?: string | null;
  package_code?: string | null;
  package_name?: string | null;
  kyc_status?: string;
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
};

export default function ProfilePage() {
  const t = useContent('dashboard').profile;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
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
    setPhone((p.phone || '').replace(/\D/g, '').slice(0, 10));
    setPhoneError('');
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

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 10) {
      setPhone(digits.slice(0, 10));
      setPhoneError(t.phoneTooLong || 'Phone number cannot exceed 10 digits');
      return;
    }
    setPhone(digits);
    setPhoneError('');
  }

  async function savePersonal(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError(t.phoneInvalid || 'Enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setSaving(true);
    try {
      const p = await api.patch('/api/v1/users/me', { full_name: name, phone });
      applyProfile(p as Profile);
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation(e: FormEvent) {
    e.preventDefault();
    if (!addressLine.trim()) {
      toast.error(t.addressRequired);
      return;
    }
    setSaving(true);
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
      setSaving(false);
    }
  }

  async function saveKyc(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
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
      setSaving(false);
    }
  }

  async function saveBank(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
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
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const packageLabel =
    profile?.package_name && profile?.package_code
      ? `${profile.package_name} (${profile.package_code})`
      : profile?.package_name || profile?.package_code || '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{t.accountTitle}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t.accountSubtitle}</p>
          </div>
          {profile?.status ? (
            <Badge tone={profile.status === 'active' ? 'success' : 'warning'}>{profile.status}</Badge>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.email}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{profile?.email || user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.referralCode}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{profile?.referral_code || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.package}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{packageLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.sponsor}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {profile?.sponsor_referral_code
                ? `${profile.sponsor_name || ''} (${profile.sponsor_referral_code})`.trim()
                : t.noSponsor}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.joined}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {profile?.created_at ? formatDate(profile.created_at) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.fields.activated}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {profile?.activated_at ? formatDate(profile.activated_at) : '—'}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">{t.personalTitle}</h2>
        <form onSubmit={savePersonal} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input id="name" label={t.fields.name} value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="email" label={t.fields.email} value={profile?.email || user?.email || ''} disabled />
          <Input
            id="phone"
            label={t.fields.phone}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={phoneError}
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              {t.save}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{t.locationTitle}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t.locationSubtitle}</p>
          </div>
          <Button type="button" variant="outline" loading={locating} onClick={useCurrentLocation}>
            <Navigation className="mr-1.5 h-4 w-4" />
            {t.useCurrentLocation}
          </Button>
        </div>
        <form onSubmit={saveLocation} className="mt-4 space-y-4">
          <div className="relative">
            <label className="block space-y-1.5" htmlFor="addressLine">
              <span className="text-sm font-medium text-ink">{t.fields.address}</span>
              <textarea
                id="addressLine"
                rows={3}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus-ring"
                value={addressLine}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                required
                autoComplete="off"
              />
              <span className="text-xs text-ink-muted">{searching ? t.searching : t.searchHint}</span>
            </label>
            {hits.length > 0 ? (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white shadow-elevated">
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="locality" label={t.fields.locality} value={locality} onChange={(e) => setLocality(e.target.value)} />
            <Input id="state" label={t.fields.state} value={stateName} onChange={(e) => setStateName(e.target.value)} />
            <Input id="pincode" label={t.fields.pincode} value={pincode} onChange={(e) => setPincode(e.target.value)} />
            <Input id="country" label={t.fields.country} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          {(latitude || longitude) && (
            <p className="text-xs text-ink-muted">
              {t.coordsLabel}: {latitude}, {longitude}
              {locationSource ? ` · ${locationSource}` : ''}
            </p>
          )}
          <Button type="submit" loading={saving}>
            {t.saveLocation}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{t.kycTitle}</h2>
          {profile?.kyc_status ? (
            <Badge tone={profile.kyc_status === 'verified' ? 'success' : 'warning'}>{profile.kyc_status}</Badge>
          ) : null}
        </div>
        <form onSubmit={saveKyc} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input id="pan" label={t.fields.pan} value={pan} onChange={(e) => setPan(e.target.value)} />
          <Input id="aadhaar" label={t.fields.aadhaar} value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              {t.save}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">{t.bankTitle}</h2>
        <form onSubmit={saveBank} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            id="accountName"
            label={t.fields.accountName}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <Input id="bankName" label={t.fields.bankName} value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <Input
            id="accountNumber"
            label={t.fields.accountNumber}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <Input id="ifsc" label={t.fields.ifsc} value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              {t.save}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
