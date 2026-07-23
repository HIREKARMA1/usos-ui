'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ShopOrderDetailPage() {
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
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container max-w-3xl py-10">
        {success ? (
          <div className="mb-6 rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-sm text-green">
            Payment successful! Points have been credited to your account.
          </div>
        ) : null}
        {!order ? (
          <Card>Order not found</Card>
        ) : (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold">Order details</h1>
                <p className="mt-1 text-sm text-ink-muted">{order.id}</p>
                <p className="text-sm text-ink-muted">{formatDate(order.created_at)}</p>
              </div>
              <Badge tone={order.status === 'paid' ? 'success' : 'warning'}>{order.status}</Badge>
            </div>
            <ul className="mt-6 space-y-3 border-t border-line pt-4">
              {(order.items || []).map((item: any, idx: number) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
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
            <div className="mt-4 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total_inr)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700">Points earned: {order.total_points}</p>
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
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
