'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { AdminUserRow } from '@/types';

export default function AdminUsersPage() {
  const t = useContent('admin').users;
  const common = useContent('common');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.email.toLowerCase().includes(q.toLowerCase())
  );

  async function toggle(userId: string, current: string) {
    const next = current === 'active' ? 'suspended' : 'active';
    await api.toggleUserStatus(userId, next);
    toast.success(t.statusUpdated);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <Input id="search" placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table
            headers={[
              t.table.name,
              t.table.contact,
              t.table.joined,
              t.table.status,
              t.table.actions,
            ]}
          >
            {filtered.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink-muted">{u.email}</p>
                </Td>
                <Td>{u.phone}</Td>
                <Td>{formatDate(u.joinedAt)}</Td>
                <Td>
                  <Badge tone={u.status === 'active' ? 'success' : 'warning'}>
                    {common.status[u.status] || u.status}
                  </Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => toggle(u.id, u.status)}>
                    {u.status === 'active' ? t.deactivate : t.activate}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
