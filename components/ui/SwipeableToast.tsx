'use client';

import { PointerEvent, useRef, useState } from 'react';
import toast, { ToastBar, type Toast } from 'react-hot-toast';

const DISMISS_AT = 72;

/** Keeps the normal toast timer. A rightward swipe closes this message early. */
export function SwipeableToast({ toast: item }: { toast: Toast }) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragX = useRef(0);
  const horizontal = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  function reset() {
    startX.current = null;
    startY.current = null;
    dragX.current = 0;
    horizontal.current = false;
    setDragging(false);
    setOffset(0);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
    horizontal.current = false;
    dragX.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startX.current == null || startY.current == null) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    if (!horizontal.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        reset();
        return;
      }
      if (dx > 8) horizontal.current = true;
      else return;
    }
    const next = Math.max(0, dx);
    dragX.current = next;
    setOffset(next);
  }

  function onPointerUp() {
    if (dragX.current >= DISMISS_AT) toast.dismiss(item.id);
    reset();
  }

  return (
    <div
      style={{
        transform: `translateX(${offset}px)`,
        transition: dragging ? 'none' : 'transform 0.2s ease',
        opacity: offset > DISMISS_AT ? 0.55 : 1,
        touchAction: 'pan-y',
        pointerEvents: 'auto',
        cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <ToastBar toast={item} />
    </div>
  );
}
