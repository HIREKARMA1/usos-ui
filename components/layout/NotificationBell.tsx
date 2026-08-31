'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { UserNotification } from '@/types';

export function NotificationBell({
  title,
  markAllLabel,
  emptyLabel,
}: {
  title: string;
  markAllLabel: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await api.getNotifications();
      setItems(data.items || []);
      setUnread(data.unread_count || 0);
    } catch {
      /* not authed or endpoint unavailable */
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 45000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markOne(id: string) {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    try {
      await api.markAllNotificationsRead();
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-ink hover:bg-surface-muted"
        aria-label={title}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface-card shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-semibold text-ink">{title}</p>
            {unread > 0 ? (
              <button type="button" onClick={markAll} className="text-xs font-medium text-primary hover:underline">
                {markAllLabel}
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-ink-muted">{emptyLabel}</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className={cn('border-b border-line/70 last:border-0', !n.read && 'bg-primary/5')}>
                  <Link
                    href="/user/profile"
                    onClick={() => {
                      if (!n.read) markOne(n.id);
                      setOpen(false);
                    }}
                    className="block px-3 py-2.5 hover:bg-surface-muted"
                  >
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-secondary">{n.message}</p>
                    {n.created_at ? (
                      <p className="mt-1 text-[11px] text-ink-muted">{formatDateTime(n.created_at)}</p>
                    ) : null}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
