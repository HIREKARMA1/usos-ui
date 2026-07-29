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
      toast.error('Enter how many points you want to redeem');
      return;
    }
    setRedeeming(true);
    try {
      const res = await api.redeemPoints(n);
      toast.success(
        `Done — ₹${(res.user_credited_paise / 100).toFixed(0)} to you, ₹${(res.sponsor_credited_paise / 100).toFixed(0)} to your sponsor`
      );
      setPoints('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Redemption didn’t go through. Try again.');
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">Points wallet</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Shop to earn points. Redeem anytime — half credits your wallet, half credits your sponsor. Then
          withdraw cash to your bank.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Available points</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-primary">{bal}</p>
          <p className="mt-2 text-sm text-ink-muted">
            ≈ {formatCurrency((bal * valuePaise) / 100)} at ₹{(valuePaise / 100).toFixed(0)}/point
          </p>
        </Card>
        <Card className="border-sky/20 bg-gradient-to-br from-sky/[0.07] to-transparent">
          <h2 className="text-lg font-bold tracking-tight">50 / 50 sponsor split</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Every redeem splits value with the person who opened your door.
          </p>
          <div className="mt-4 flex overflow-hidden rounded-full border border-line bg-white text-center text-xs font-bold">
            <div
              className="bg-primary px-3 py-2.5 text-white"
              style={{ flex: data?.user_share_bps || 5000 }}
            >
              You {Math.round((data?.user_share_bps || 5000) / 100)}%
            </div>
            <div
              className="bg-sky px-3 py-2.5 text-[#0f1622]"
              style={{ flex: data?.sponsor_share_bps || 5000 }}
            >
              Sponsor {Math.round((data?.sponsor_share_bps || 5000) / 100)}%
            </div>
          </div>
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={onRedeem}>
            <label className="text-sm">
              <span className="font-medium">Points to redeem</span>
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
            Example: 100 pts (₹100) → ₹50 to you + ₹50 to your sponsor.
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
            title="No points yet — your shop streak starts here"
            description="Browse the shop, place an order, and watch points land in this balance."
          />
        )}
      </Card>
    </div>
  );
}
