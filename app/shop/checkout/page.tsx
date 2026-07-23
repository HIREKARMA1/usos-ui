'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
import { PayUCheckoutForm } from '@/components/auth/PayUCheckoutForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

function CheckoutInner() {
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
        setSubmitting(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
        <Spinner />
      </div>
    );
  }

  if (payu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f1f3f6] px-4">
        <p className="font-semibold text-ink">Redirecting to PayU secure payment…</p>
        <PayUCheckoutForm action={payu.action} fields={payu.fields} buttonLabel="Pay now" />
      </div>
    );
  }

  const steps = ['Cart', 'Address', 'Payment'];
  const total = (cart?.total_paise || 0) / 100;

  return (
    <ShopLayout>
      <main className="page-container py-4 sm:py-6">
        <ShopBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: 'Cart', href: '/shop/cart' },
            { label: 'Checkout' },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {steps.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-2">
              {i > 0 ? <span className="text-ink-muted">›</span> : null}
              <span className={cn('font-semibold', i === 1 ? 'text-primary' : 'text-ink-muted')}>{s}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <form id="checkout-form" onSubmit={onSubmit} className="space-y-4">
            <div className="border border-line bg-white p-4 shadow-sm sm:p-6">
              <h1 className="text-lg font-bold text-ink">Delivery address</h1>
              <p className="mt-1 text-xs text-ink-muted">Prefilled from your profile — edit if needed.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['shipping_name', 'Full name', 'text'],
                    ['shipping_phone', 'Phone', 'tel'],
                    ['shipping_address', 'Address', 'text'],
                    ['shipping_city', 'City', 'text'],
                    ['shipping_state', 'State', 'text'],
                    ['shipping_pincode', 'PIN code', 'text'],
                  ] as const
                ).map(([key, label, type]) => (
                  <label
                    key={key}
                    className={cn('block text-sm', key === 'shipping_address' && 'sm:col-span-2')}
                  >
                    <span className="font-medium text-ink">{label}</span>
                    {key === 'shipping_address' ? (
                      <textarea
                        required
                        rows={3}
                        className="mt-1 w-full rounded border border-line px-3 py-2 outline-none focus:border-primary"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        required
                        type={type}
                        className="mt-1 w-full rounded border border-line px-3 py-2 outline-none focus:border-primary"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-line bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-ink">Order items</h2>
              <ul className="mt-4 divide-y divide-line">
                {(cart?.items || []).map((item: any) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden border border-line">
                      {item.product?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.image_url} alt="" className="h-full w-full object-contain" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.product?.name}</p>
                      <p className="text-xs text-ink-muted">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency((item.line_total_paise || 0) / 100)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <Button type="submit" className="w-full lg:hidden" size="lg" variant="accent" loading={submitting}>
              Continue to PayU · {formatCurrency(total)}
            </Button>
          </form>

          <aside className="h-fit border border-line bg-white p-4 shadow-sm lg:sticky lg:top-[7.5rem]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Price details</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Price</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
              <div className="flex justify-between text-green">
                <dt>Points on payment</dt>
                <dd>+{cart?.total_points || 0}</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-line pt-3 text-base font-bold">
                <dt>Amount payable</dt>
                <dd className="text-primary">{formatCurrency(total)}</dd>
              </div>
            </dl>
            <Button
              type="submit"
              form="checkout-form"
              className="mt-5 hidden w-full lg:inline-flex"
              size="lg"
              variant="accent"
              loading={submitting}
            >
              Continue to PayU
            </Button>
            <Link href="/shop/cart" className="mt-3 block text-center text-sm font-semibold text-primary">
              Back to cart
            </Link>
          </aside>
        </div>
      </main>
    </ShopLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
          <Spinner />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
