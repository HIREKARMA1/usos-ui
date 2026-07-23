'use client';

import { FormEvent, useState } from 'react';
import { Network } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TreeCanvas, mapGenealogyNode } from '@/components/genealogy/TreeCanvas';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import type { TreeMember } from '@/types';

export default function AdminGenealogyPage() {
  const t = useContent('admin').genealogy;
  const dash = useContent('dashboard').genealogy;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [tree, setTree] = useState<TreeMember | null>(null);
  const [selected, setSelected] = useState<string>('');

  async function search(e: FormEvent) {
    e.preventDefault();
    const rows = await api.get<any[]>('/api/v1/genealogy/admin/search', { q });
    setResults(rows || []);
    setTree(null);
  }

  async function openTree(userId: string, name: string) {
    setSelected(name);
    const data = await api.get(`/api/v1/admin/users/${userId}/tree`);
    setTree(mapGenealogyNode(data));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input id="q" placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit">{t.searchButton}</Button>
      </form>
      {results.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {results.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.full_name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {r.referral_code} · {r.email}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openTree(r.id, r.full_name)}>
                  {t.searchButton}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card padding={false} className="overflow-hidden p-3 sm:p-4">
        {tree ? (
          <>
            <p className="mb-3 px-1 text-sm text-ink-muted">
              {t.resultLabel}: <strong>{selected}</strong>
            </p>
            <TreeCanvas
              root={tree}
              youLabel={selected}
              directLabel={dash.stats.directsShort || dash.stats.directs}
              hintDrag={dash.hintDrag}
              hintZoom={dash.hintZoom}
            />
          </>
        ) : (
          <EmptyState icon={Network} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
