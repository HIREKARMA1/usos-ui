'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Tone = 'danger' | 'primary';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading = false,
  tone = 'danger',
  icon: Icon = AlertTriangle,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  tone?: Tone;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading]);

  const danger = tone === 'danger';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label={cancelLabel}
            disabled={loading}
            className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[3px] dark:bg-black/65"
            onClick={() => {
              if (!loading) onClose();
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-surface-card shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] dark:border-white/10 dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.85)]"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={cn('h-1', danger ? 'bg-accent-red' : 'bg-primary')} />
            <div className="px-5 pb-5 pt-5 sm:px-6">
              <div className="flex gap-3.5">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
                    danger
                      ? 'bg-red-500/10 text-accent-red ring-red-500/20'
                      : 'bg-primary/10 text-primary ring-primary/20'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 id={titleId} className="font-display text-lg font-bold tracking-tight text-ink">
                    {title}
                  </h3>
                  <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {description}
                  </p>
                </div>
              </div>
              {children ? <div className="mt-4">{children}</div> : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-muted/50 px-5 py-3.5 dark:bg-white/[0.03] sm:px-6">
              <Button
                ref={cancelRef}
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={onClose}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={danger ? 'danger' : 'primary'}
                size="sm"
                loading={loading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
