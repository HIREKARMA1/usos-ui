'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

function OrderDetailInner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const success = params.get('payment') === 'success';

  useEffect(() => {
    if (!id) return;
    api
      .getShopOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
        <Spinner />
      </div>
    );
  }

  return (
    <ShopLayout>
      <main className="page-container max-w-3xl py-4 sm:py-6">
        <ShopBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: 'Orders', href: '/user/orders' },
            { label: 'Details' },
          ]}
        />

        {success ? (
          <div className="mt-4 flex items-start gap-3 border border-green/30 bg-green/10 px-4 py-4 text-sm text-green">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Payment successful!</p>
              <p className="mt-0.5">Your order is confirmed and points have been credited.</p>
            </div>
          </div>
        ) : null}

        {!order ? (
          <div className="mt-4 border border-line bg-white p-8 text-center">Order not found</div>
        ) : (
          <div className="mt-4 border border-line bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-ink sm:text-2xl">Order details</h1>
                <p className="mt-1 text-xs text-ink-muted">#{order.id}</p>
                <p className="text-sm text-ink-muted">{formatDate(order.created_at)}</p>
              </div>
              <Badge tone={order.status === 'paid' ? 'success' : 'warning'}>{order.status}</Badge>
            </div>

            {(order.shipping_name || order.shipping_address) && (
              <div className="mt-5 rounded border border-line bg-[#f1f3f6] p-4 text-sm">
                <p className="font-semibold text-ink">Delivery address</p>
                <p className="mt-1 text-ink-secondary">
                  {order.shipping_name}
                  {order.shipping_phone ? ` · ${order.shipping_phone}` : ''}
                </p>
                <p className="text-ink-secondary">
                  {[order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}

            <ul className="mt-6 space-y-3 border-t border-line pt-4">
              {(order.items || []).map((item: any, idx: number) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <div className="h-14 w-14 shrink-0 overflow-hidden border border-line bg-white">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-contain" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {item.product_name} × {item.quantity}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatCurrency((item.unit_price_paise || 0) / 100)} each
                      {item.line_points ? ` · ${item.line_points} pts` : ''}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCurrency((item.line_total_paise || 0) / 100)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-between border-t border-dashed border-line pt-4 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total_inr)}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-green">Points earned: {order.total_points}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button variant="outline">Continue shopping</Button>
              </Link>
              <Link href="/user/points">
                <Button>View points</Button>
              </Link>
              <Link href="/user/orders">
                <Button variant="outline">All orders</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </ShopLayout>
  );
}

export default function ShopOrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
          <Spinner />
        </div>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}
