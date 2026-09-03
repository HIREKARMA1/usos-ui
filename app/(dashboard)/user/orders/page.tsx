'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getShopOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">My orders</h1>
          <p className="mt-1 text-sm text-ink-muted">Product repurchase history.</p>
        </div>
        <Link href="/shop">
          <Button variant="outline">Shop again</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Visit the shop to repurchase products and earn points."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{formatCurrency(o.total_inr)}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(o.created_at)} · {o.items?.length || 0} item(s) · {o.total_points} pts
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    tone={
                      o.status === 'paid' || o.status === 'fulfilled' ? 'success' : 'warning'
                    }
                  >
                    {o.status}
                  </Badge>
                  <Link href={`/shop/orders/${o.id}`} className="text-sm font-semibold text-primary">
                    View
                  </Link>
                </div>
              </div>

              <ul className="divide-y divide-line border-t border-line">
                {(o.items || []).map((item: any) => (
                  <li key={`${o.id}-${item.product_id}`} className="flex items-center gap-3 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{item.product_name}</p>
                      <p className="text-xs text-ink-muted">
                        {formatCurrency(item.unit_price_inr ?? (item.unit_price_paise || 0) / 100)} × {item.quantity}
                        {item.line_points ? ` · ${item.line_points} pts` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatCurrency(item.line_total_inr ?? (item.line_total_paise || 0) / 100)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
