'use client';

import { useEffect, useState } from 'react';
import { Network, Users, UserCheck, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { TreeCanvas, mapGenealogyNode, countDownline } from '@/components/genealogy/TreeCanvas';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import type { TreeMember } from '@/types';

export default function GenealogyPage() {
  const t = useContent('dashboard').genealogy;
  const [tree, setTree] = useState<TreeMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getGenealogy()
      .then((data: any) => setTree(mapGenealogyNode(data)))
      .catch(() => setTree(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const counts = countDownline(tree);
  const hasDownline = (tree?.children?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.stats.total} value={counts.total} icon={Network} />
        <StatCard label={t.stats.directs} value={counts.directs} icon={Users} tone="sky" />
        <StatCard label={t.stats.active} value={counts.active} icon={UserCheck} tone="green" />
        <StatCard label={t.stats.levels} value={counts.depth} icon={Layers} tone="orange" />
      </div>
      <Card padding={false} className="overflow-hidden p-3 sm:p-4">
        {tree && hasDownline ? (
          <TreeCanvas
            root={tree}
            youLabel={t.you}
            directLabel={t.stats.directsShort || t.stats.directs}
            hintDrag={t.hintDrag}
            hintZoom={t.hintZoom}
          />
        ) : (
          <EmptyState icon={Network} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
