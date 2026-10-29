'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent, type ReactNode } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TreeMember } from '@/types';

function isActiveMember(status: TreeMember['status']) {
  return status === 'active';
}

function firstTwoPoints(points: Map<number, { x: number; y: number }>) {
  const iter = points.values();
  const first = iter.next().value;
  const second = iter.next().value;
  if (!first || !second) return null;
  return [first, second] as const;
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

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.8;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(3))));
}

function ZoomBar({
  scale,
  onZoomOut,
  onZoomIn,
  onReset,
  className,
}: {
  scale: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  className?: string;
}) {
  const zoomBtn =
    'flex h-11 w-11 items-center justify-center rounded-full text-ink transition active:scale-95 hover:bg-surface-muted disabled:opacity-40';
  return (
    <div
      data-zoom-controls
      className={cn(
        'flex items-center gap-0.5 rounded-full border border-line bg-surface-card/95 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.16)] backdrop-blur-sm',
        className
      )}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" className={zoomBtn} onClick={onZoomOut} disabled={scale <= MIN_SCALE} aria-label="zoom out">
        <Minus className="h-5 w-5" />
      </button>
      <span className="min-w-[3.25rem] select-none text-center text-sm font-semibold tabular-nums text-ink">
        {Math.round(scale * 100)}%
      </span>
      <button type="button" className={zoomBtn} onClick={onZoomIn} disabled={scale >= MAX_SCALE} aria-label="zoom in">
        <Plus className="h-5 w-5" />
      </button>
      <span className="mx-0.5 h-6 w-px bg-line" aria-hidden />
      <button type="button" className={zoomBtn} onClick={onReset} aria-label="reset">
        <Maximize2 className="h-4 w-4" />
      </button>
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
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);
  const drag = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, pointerId: null, startX: 0, startY: 0, originX: 0, originY: 0 });

  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setScale(0.7);
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-zoom-controls]')) return;
    const el = viewportRef.current;
    if (!el) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture(e.pointerId);
    if (pointers.current.size >= 2) {
      const pts = firstTwoPoints(pointers.current);
      if (!pts) return;
      drag.current.active = false;
      pinch.current = {
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startScale: scaleRef.current,
      };
      return;
    }
    if (e.button !== 0) return;
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
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current && pinch.current.startDist > 0) {
      const pts = firstTwoPoints(pointers.current);
      if (!pts) return;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setScale(clampScale(pinch.current.startScale * (dist / pinch.current.startDist)));
      return;
    }
    if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
    setOffset({
      x: drag.current.originX + (e.clientX - drag.current.startX),
      y: drag.current.originY + (e.clientY - drag.current.startY),
    });
  }, []);

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current.pointerId === e.pointerId) {
      drag.current.active = false;
      drag.current.pointerId = null;
    }
  }, []);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => clampScale(s + delta));
  }, []);

  const resetView = () => {
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    setScale(mobile ? 0.7 : 1);
    setOffset({ x: 0, y: 0 });
  };

  const zoomOut = () => setScale((s) => clampScale(s - 0.15));
  const zoomIn = () => setScale((s) => clampScale(s + 0.15));

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
          <span className="hidden sm:inline">
            {hintDrag}
            {hintZoom ? ` · ${hintZoom}` : ''}
          </span>
        </div>
        <ZoomBar className="hidden sm:flex" scale={scale} onZoomOut={zoomOut} onZoomIn={zoomIn} onReset={resetView} />
      </div>

      <div
        ref={viewportRef}
        className={cn(
          'relative h-[min(68svh,720px)] w-full touch-none overflow-hidden rounded-xl border border-line bg-[#f4f7fb] select-none sm:h-[min(76vh,720px)]',
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
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 sm:hidden">
          <ZoomBar
            className="pointer-events-auto"
            scale={scale}
            onZoomOut={zoomOut}
            onZoomIn={zoomIn}
            onReset={resetView}
          />
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
