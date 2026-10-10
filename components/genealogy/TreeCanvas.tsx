'use client';

import { useCallback, useRef, useState, type PointerEvent, type WheelEvent, type ReactNode } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { TreeMember } from '@/types';

function isActiveMember(status: TreeMember['status']) {
  return status === 'active';
}

function MemberMark() {
  return (
    <img
      src="/genealogy-mark.png"
      alt=""
      className="h-[78px] w-[78px] rounded-full bg-white object-cover shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
    />
  );
}

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
  const active = isActiveMember(node.status);
  return (
    <div className="relative z-[1] w-[210px] shrink-0 pt-9 touch-manipulation">
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
        <MemberMark />
      </div>
      <div
        className="rounded-[22px] p-[2.5px]"
        style={{
          background: active
            ? 'linear-gradient(90deg, #22c55e 0%, #2dd4bf 52%, #38bdf8 100%)'
            : 'linear-gradient(90deg, #fda4af 0%, #fb7185 48%, #f43f5e 100%)',
          boxShadow: active
            ? '0 14px 32px rgba(18, 163, 120, 0.16), 0 2px 8px rgba(42, 168, 214, 0.08)'
            : '0 14px 32px rgba(240, 68, 76, 0.14)',
        }}
      >
        <div
          className="rounded-[19px] px-5 pb-[18px] pt-11 text-center"
          style={{
            background: active
              ? 'linear-gradient(180deg, #f3fbf7 0%, #ffffff 46%)'
              : 'linear-gradient(180deg, #fff6f6 0%, #ffffff 48%)',
          }}
        >
          {label ? (
            <span className="inline-flex rounded-full bg-[#18a56a] px-3 py-[3px] text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              {label}
            </span>
          ) : null}
          <p
            className={cn(
              'truncate font-display text-[20px] font-bold leading-tight text-[#1c2430]',
              label ? 'mt-2.5' : 'mt-1'
            )}
          >
            {node.name}
          </p>
          <p className="mt-1 truncate text-[14px] font-medium tracking-wide text-[#8b95a5]">{node.referralCode}</p>
          <div className="mt-3.5 flex items-center justify-center gap-3">
            <span
              className="rounded-full px-3.5 py-1 text-[13px] font-semibold text-white"
              style={{ background: active ? '#18a56a' : '#f04b52' }}
            >
              {active ? 'Active' : 'Inactive'}
            </span>
            {childCount > 0 && directLabel ? (
              <span className="text-[15px] font-semibold text-[#2457c5]">
                {childCount} {directLabel}
              </span>
            ) : null}
          </div>
        </div>
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
          <div className="h-8 w-px bg-[#d3dbe4]" />
          <div className="flex items-start">
            {kids.map((child, index) => (
              <div key={child.id} className="relative flex flex-col items-center px-4 pt-7">
                <span
                  className="pointer-events-none absolute left-1/2 top-0 z-0 w-px -translate-x-1/2 bg-[#d3dbe4]"
                  style={{ height: 'calc(1.75rem + 2.25rem)' }}
                  aria-hidden
                />
                {index > 0 ? (
                  <span className="pointer-events-none absolute left-0 top-0 z-0 h-px w-1/2 bg-[#d3dbe4]" aria-hidden />
                ) : null}
                {index < kids.length - 1 ? (
                  <span className="pointer-events-none absolute right-0 top-0 z-0 h-px w-1/2 bg-[#d3dbe4]" aria-hidden />
                ) : null}
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
  const [scale, setScale] = useState(1);
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
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green" aria-hidden />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red" aria-hidden />
            Inactive
          </span>
          <span>
            {hintDrag}
            {hintZoom ? ` · ${hintZoom}` : ''}
          </span>
        </div>
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
          'relative h-[min(76vh,720px)] w-full touch-none overflow-hidden rounded-xl border border-line bg-[#f4f7fb] select-none',
          drag.current.active ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        <div
          className="absolute left-1/2 top-10 origin-top"
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
    status: data.status === 'active' ? 'active' : data.status === 'pending_payment' || data.status === 'pending' ? 'pending' : 'inactive',
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
