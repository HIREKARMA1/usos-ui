'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { PayUCheckoutForm } from '@/components/auth/PayUCheckoutForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payu, setPayu] = useState<{ action: string; fields: Record<string, string> } | null>(null);
  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
  });

  useEffect(() => {
    if (params.get('payment') === 'failed') {
      toast.error(params.get('message') || 'Payment failed');
    }
  }, [params]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/shop/checkout');
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([api.getCart(), api.getMyProfile().catch(() => null)])
      .then(([c, profile]) => {
        if (cancelled) return;
        setCart(c);
        if (!c?.items?.length) {
          router.replace('/shop/cart');
          return;
        }
        setForm({
          shipping_name: profile?.full_name || user.name || '',
          shipping_phone: profile?.phone || '',
          shipping_address: profile?.address_line || '',
          shipping_city: profile?.address_locality || '',
          shipping_state: profile?.address_state || '',
          shipping_pincode: profile?.address_pincode || '',
        });
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast.error(e?.response?.data?.detail || 'Could not load cart');
        router.replace('/shop/cart');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await api.checkoutShop(form);
      const checkout = order.checkout;
      if (checkout?.mode === 'hosted_form' && checkout.action_url && checkout.params) {
        setPayu({ action: checkout.action_url, fields: checkout.params });
      } else {
        toast.error('Checkout session unavailable');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (payu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-ink-muted">Redirecting to PayU…</p>
        <PayUCheckoutForm action={payu.action} fields={payu.fields} buttonLabel="Pay now" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container grid gap-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h1 className="font-display text-2xl font-extrabold">Delivery address</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {(
              [
                ['shipping_name', 'Full name'],
                ['shipping_phone', 'Phone'],
                ['shipping_address', 'Address'],
                ['shipping_city', 'City'],
                ['shipping_state', 'State'],
                ['shipping_pincode', 'PIN code'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-ink">{label}</span>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <Button type="submit" className="w-full" loading={submitting} variant="accent">
              Pay {formatCurrency((cart?.total_paise || 0) / 100)}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {(cart?.items || []).map((item: any) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.product?.name} × {item.quantity}
                </span>
                <span>{formatCurrency((item.line_total_paise || 0) / 100)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency((cart?.total_paise || 0) / 100)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700">Earn {cart?.total_points || 0} points after payment</p>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
