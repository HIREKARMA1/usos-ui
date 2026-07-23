'use client';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Coins } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function PointsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  function load() {
    api
      .getPoints()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function onRedeem(e: FormEvent) {
    e.preventDefault();
    const n = Number(points);
    if (!n || n < 1) {
      toast.error('Enter points to redeem');
      return;
    }
    setRedeeming(true);
    try {
      const res = await api.redeemPoints(n);
      toast.success(
        `Redeemed ${n} pts → you ₹${(res.user_credited_paise / 100).toFixed(0)}, sponsor ₹${(res.sponsor_credited_paise / 100).toFixed(0)}`
      );
      setPoints('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Redeem failed');
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const valuePaise = data?.point_value_paise || 100;
  const bal = data?.balance || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Points</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Earn points by buying products. Redeem to wallet — 50% to you, 50% to your referrer. Then withdraw
          wallet balance to your bank.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase text-ink-muted">Available points</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-primary">{bal}</p>
          <p className="mt-2 text-sm text-ink-muted">
            ≈ {formatCurrency((bal * valuePaise) / 100)} at ₹{(valuePaise / 100).toFixed(0)}/point
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Redeem points</h2>
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={onRedeem}>
            <label className="text-sm">
              <span className="font-medium">Points</span>
              <input
                type="number"
                min={1}
                max={bal}
                className="mt-1 block w-40 rounded-lg border border-line px-3 py-2"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </label>
            <Button type="submit" loading={redeeming} disabled={bal < 1}>
              Redeem to wallet
            </Button>
          </form>
          <p className="mt-3 text-xs text-ink-muted">
            Example: redeem 100 pts (₹100) → ₹50 your wallet + ₹50 sponsor wallet.
          </p>
        </Card>
      </div>

      <Card padding={false}>
        {(data?.transactions || []).length ? (
          <Table headers={['Date', 'Type', 'Category', 'Points', 'Balance']}>
            {data.transactions.map((t: any) => (
              <Tr key={t.id}>
                <Td>{formatDate(t.created_at)}</Td>
                <Td>{t.type}</Td>
                <Td>{t.category}</Td>
                <Td className={t.type === 'credit' ? 'text-green' : 'text-red'}>
                  {t.type === 'credit' ? '+' : '-'}
                  {t.points}
                </Td>
                <Td>{t.balance_after}</Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState
            icon={Coins}
            title="No points yet"
            description="Buy products from the shop to start earning points."
          />
        )}
      </Card>
    </div>
  );
}
