'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/layout/PublicShell';
import { PayUCheckoutForm } from '@/components/auth/PayUCheckoutForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { needsPayment, PAYMENT_PENDING_MESSAGE, postAuthPath } from '@/lib/access';
import type { PaymentOrder } from '@/types';

function PaymentContent() {
  const t = useContent('auth').payment;
  const dash = useContent('dashboard');
  const { user, loading, loginSuccess, logout } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(search.get('payment') === 'success');
  const started = useRef(false);

  const paymentStatus = search.get('payment');
  const autostart = search.get('autostart') === '1';
  const pendingMessage = t.pendingMessage || PAYMENT_PENDING_MESSAGE;

  const startCheckout = useCallback(async () => {
    setStarting(true);
    try {
      const order = await api.createPaymentOrder();
      setCheckout(order);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : t.error;
      toast.error(msg || t.error);
    } finally {
      setStarting(false);
    }
  }, [t.error]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!needsPayment(user)) {
      router.replace(postAuthPath(user));
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user || !needsPayment(user)) return;

    if (paymentStatus === 'success') {
      const token = getStoredToken();
      api
        .getMe()
        .then((me) => {
          if (token) loginSuccess(token, me);
          if (me.status === 'active') {
            toast.success(t.paid || 'Payment successful. Your account is now active.');
            router.replace(postAuthPath(me));
            return;
          }
          setConfirming(false);
        })
        .catch(() => {
          setConfirming(false);
          toast.error(t.error);
        });
      return;
    }

    if (paymentStatus === 'failed') {
      toast.error(search.get('message') || t.error);
    }

    if (autostart && !started.current && !paymentStatus) {
      started.current = true;
      void startCheckout();
    }
  }, [loading, user, paymentStatus, autostart, loginSuccess, router, search, startCheckout, t.paid, t.error]);

  if (loading || !user || !needsPayment(user) || confirming) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <p className="section-eyebrow">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{t.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>

      <div
        className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-ink"
        role="status"
      >
        {pendingMessage}
      </div>

      {checkout ? (
        <>
          <p className="mt-4 text-sm text-ink-muted">{t.redirecting}</p>
          <PayUCheckoutForm action={checkout.action} fields={checkout.fields} buttonLabel={t.manualButton} />
        </>
      ) : (
        <Button className="mt-6 w-full" variant="accent" loading={starting} onClick={() => void startCheckout()}>
          {starting ? t.redirecting : t.manualButton}
        </Button>
      )}

      <p className="mt-4 text-center text-xs text-ink-muted">{t.securedBy}</p>
      <button
        type="button"
        className="mt-6 w-full text-center text-sm font-semibold text-ink-muted hover:text-ink"
        onClick={() => {
          logout();
          router.replace('/login');
        }}
      >
        {dash.topbar?.logout || t.logout || 'Log out'}
      </button>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </AuthShell>
  );
}
