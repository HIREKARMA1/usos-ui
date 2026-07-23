'use client';

import { useCallback, useRef, useState, type PointerEvent, type WheelEvent, type ReactNode } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { TreeMember } from '@/types';

function NodeCard({
  node,
  label,
  directLabel,
}: {
  node: TreeMember;
  label?: string;
  directLabel?: string;
}) {
  const childCount = node.children?.length ?? 0;
  return (
    <div className="w-[148px] shrink-0 rounded-xl border border-line bg-white px-3 py-2.5 text-center shadow-card touch-manipulation">
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{label}</p>
      ) : null}
      <p className="mt-0.5 truncate text-sm font-semibold text-ink">{node.name}</p>
      <p className="truncate font-mono text-[11px] text-ink-muted">{node.referralCode}</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
        <Badge tone={node.status === 'active' ? 'success' : 'warning'}>{node.status}</Badge>
        {childCount > 0 && directLabel ? (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {childCount} {directLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  youLabel,
  isRoot,
  directLabel,
}: {
  node: TreeMember;
  youLabel?: string;
  isRoot?: boolean;
  directLabel: string;
}) {
  const kids = node.children ?? [];
  return (
    <div className="flex flex-col items-center">
      <NodeCard node={node} label={isRoot ? youLabel : undefined} directLabel={directLabel} />
      {kids.length > 0 ? (
        <>
          <div className="h-5 w-px bg-line" />
          <div className="relative flex items-start justify-center gap-3 sm:gap-4">
            {kids.length > 1 ? (
              <div
                className="absolute left-[74px] right-[74px] top-0 h-px bg-line"
                style={{ width: `calc(100% - 148px)` }}
                aria-hidden
              />
            ) : null}
            {kids.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="h-5 w-px bg-line" />
                <TreeBranch node={child} directLabel={directLabel} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function TreeCanvas({
  root,
  youLabel,
  directLabel,
  hintDrag,
  hintZoom,
}: {
  root: TreeMember;
  youLabel: string;
  directLabel: string;
  hintDrag?: string;
  hintZoom?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.9);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, pointerId: null, startX: 0, startY: 0, originX: 0, originY: 0 });

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = viewportRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }, [offset.x, offset.y]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
    setOffset({
      x: drag.current.originX + (e.clientX - drag.current.startX),
      y: drag.current.originY + (e.clientY - drag.current.startY),
    });
  }, []);

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId === e.pointerId) {
      drag.current.active = false;
      drag.current.pointerId = null;
    }
  }, []);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => Math.min(1.8, Math.max(0.45, s + delta)));
  }, []);

  const resetView = () => {
    setScale(0.9);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          {hintDrag}
          {hintZoom ? ` · ${hintZoom}` : ''}
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => setScale((s) => Math.max(0.45, s - 0.1))} aria-label="zoom out">
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setScale((s) => Math.min(1.8, s + 0.1))} aria-label="zoom in">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetView} aria-label="reset">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={cn(
          'relative h-[min(70vh,560px)] w-full touch-none overflow-hidden rounded-xl border border-line bg-surface-soft select-none',
          drag.current.active ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        <div
          className="absolute left-1/2 top-6 origin-top"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px) scale(${scale})`,
          }}
        >
          <TreeBranch node={root} youLabel={youLabel} isRoot directLabel={directLabel} />
        </div>
      </div>
    </div>
  );
}

/** Shared mapper from API sponsor-tree payload */
export function mapGenealogyNode(data: any): TreeMember {
  const children = Array.isArray(data.children)
    ? data.children.map(mapGenealogyNode)
    : [
        ...(data.left ? [mapGenealogyNode(data.left)] : []),
        ...(data.right ? [mapGenealogyNode(data.right)] : []),
      ];
  return {
    id: data.id,
    name: data.full_name || data.name || '',
    referralCode: data.referral_code || data.referralCode || '',
    packageId: 'A',
    status: data.status === 'active' ? 'active' : 'pending',
    joinedAt: data.created_at || data.joinedAt || '',
    children,
  };
}

export function countDownline(node: TreeMember | null | undefined): { total: number; active: number; directs: number; depth: number } {
  if (!node) return { total: 0, active: 0, directs: 0, depth: 0 };
  const kids = node.children ?? [];
  let total = 0;
  let active = 0;
  let depth = 0;
  for (const c of kids) {
    const sub = countDownline(c);
    total += 1 + sub.total;
    active += (c.status === 'active' ? 1 : 0) + sub.active;
    depth = Math.max(depth, 1 + sub.depth);
  }
  return { total, active, directs: kids.length, depth };
}

export function TreeHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-ink-muted">{children}</p>;
}
