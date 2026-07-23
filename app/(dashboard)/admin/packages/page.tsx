'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { PackagePlan } from '@/types';

export default function AdminPackagesPage() {
  const t = useContent('admin').packages;
  const [rows, setRows] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPackages().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table headers={[t.table.name, t.table.price, t.table.stock, t.table.status]}>
            {rows.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.description}</p>
                </Td>
                <Td>{formatCurrency(p.price)}</Td>
                <Td>{p.stock ?? '—'}</Td>
                <Td>
                  <Badge tone="success">active</Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
