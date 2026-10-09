'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  generateUpiAppUrl,
  generateUpiPaymentUrl,
  openUpiDeepLink,
  qrCodeImageUrl,
  type UpiAppId,
  type UpiPaymentParams,
  validateUpiPaymentParams,
} from '@/lib/upi';
import { useContent } from '@/hooks/useContent';
import styles from '@/app/payment/payment.module.css';

type PayTab = 'qr' | 'upi';

const UPI_APPS: { id: UpiAppId; labelKey: 'googlePay' | 'phonePe' | 'paytm' | 'otherUpiApp' }[] = [
  { id: 'gpay', labelKey: 'googlePay' },
  { id: 'phonepe', labelKey: 'phonePe' },
  { id: 'paytm', labelKey: 'paytm' },
  { id: 'other', labelKey: 'otherUpiApp' },
];

function errorDetail(err: unknown, fallback: string) {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return fallback;
}

function badgeTone(status: string) {
  if (status === 'paid' || status === 'fulfilled') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending_approval') return 'warning';
  return 'default';
}

export default function ShopOrderDetailPage() {
  const t = useContent('auth').payment;
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txn, setTxn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<PayTab>('qr');
  const [copied, setCopied] = useState(false);
  const [appSheetOpen, setAppSheetOpen] = useState(false);
  const [openingApp, setOpeningApp] = useState<UpiAppId | null>(null);
  const [awaitingUtr, setAwaitingUtr] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getShopOrderPayment(id);
      setPaymentInfo(data);
      setOrder(data.order);
    } catch {
      try {
        setOrder(await api.getShopOrder(id));
        setPaymentInfo(null);
      } catch {
        setOrder(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order || order.status !== 'pending_approval' || !id) return;
    const timer = window.setInterval(() => {
      void api
        .getShopOrder(id)
        .then((next) => {
          setOrder(next);
          if (next.status === 'paid' || next.status === 'fulfilled') {
            toast.success('Payment approved. Points have been credited.');
          }
        })
        .catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [order, id]);

  const amountInr = paymentInfo
    ? typeof paymentInfo.amount_inr === 'number'
      ? paymentInfo.amount_inr
      : (paymentInfo.amount_paise || order?.total_paise || 0) / 100
    : (order?.total_paise || 0) / 100;
  const amountLabel = formatCurrency(amountInr);
  const merchantName = (paymentInfo?.display_name || '').trim() || 'USOS';

  const upiParams = useMemo<UpiPaymentParams | null>(() => {
    if (!paymentInfo) return null;
    return {
      upiId: paymentInfo.upi_id || '',
      merchantName,
      amount: amountInr,
      note: paymentInfo.note || 'Shop order',
    };
  }, [paymentInfo, merchantName, amountInr]);

  const upiValid = upiParams ? validateUpiPaymentParams(upiParams) === null : false;
  const upiLink = useMemo(() => {
    if (!upiParams || !upiValid) return '';
    try {
      return generateUpiPaymentUrl(upiParams);
    } catch {
      return '';
    }
  }, [upiParams, upiValid]);
  const qrSrc = useMemo(() => (upiLink ? qrCodeImageUrl(upiLink) : ''), [upiLink]);

  const pending = order?.status === 'pending_approval';
  const rejected = order?.status === 'rejected';
  const paid = order?.status === 'paid' || order?.status === 'fulfilled';
  const canResubmit = rejected && !!paymentInfo;
  const utrLen = txn.length;
  const utrReady = utrLen === 12;

  async function onResubmit() {
    if (!id) return;
    if (txn.trim().length !== 12) {
      toast.error(t.invalidTxn);
      return;
    }
    setSubmitting(true);
    try {
      const next = await api.submitShopUpiPayment(id, txn.trim());
      setOrder(next);
      setTxn('');
      setAwaitingUtr(false);
      toast.success(t.submittedTitle);
    } catch (err: unknown) {
      toast.error(errorDetail(err, 'Could not submit payment'));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyUpi() {
    if (!paymentInfo?.upi_id) return;
    try {
      await navigator.clipboard.writeText(paymentInfo.upi_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  async function openSelectedApp(app: UpiAppId) {
    if (!upiParams || !upiValid) {
      toast.error(t.notConfigured);
      return;
    }
    setOpeningApp(app);
    try {
      const url = generateUpiAppUrl(app, upiParams);
      const opened = await openUpiDeepLink(url);
      setOpeningApp(null);
      setAppSheetOpen(false);
      if (opened) {
        setAwaitingUtr(true);
        return;
      }
      if (app !== 'other') {
        const fallbackOpened = await openUpiDeepLink(generateUpiPaymentUrl(upiParams));
        if (fallbackOpened) {
          setAwaitingUtr(true);
          return;
        }
      }
      toast.error(t.appNotAvailable || 'This UPI app is not available on your device.');
    } catch {
      setOpeningApp(null);
      toast.error(t.notConfigured);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container max-w-3xl py-10">
        {!order ? (
          <Card>Order not found</Card>
        ) : (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold">Order details</h1>
                <p className="mt-1 text-sm text-ink-muted">{order.id}</p>
                <p className="text-sm text-ink-muted">{formatDate(order.created_at)}</p>
              </div>
              <Badge tone={badgeTone(order.status)}>{order.status}</Badge>
            </div>

            {pending ? (
              <div className="mt-5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3" role="status">
                <p className="font-semibold text-ink">Payment submitted successfully.</p>
                <p className="mt-1 text-sm font-medium text-ink">Status: Pending Admin Approval</p>
                <p className="mt-2 text-sm text-ink-secondary">
                  Your payment is waiting for admin verification. The order stays unpaid until it is approved.
                </p>
                {order.transaction_id ? (
                  <p className="mt-2 font-mono text-xs text-ink-muted">UTR: {order.transaction_id}</p>
                ) : null}
              </div>
            ) : null}

            {paid ? (
              <div className="mt-5 rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-sm text-green">
                Payment approved. Points have been credited to your account.
              </div>
            ) : null}

            {rejected ? (
              <div className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3" role="status">
                <p className="font-semibold text-ink">{t.rejectedTitle}</p>
                <p className="mt-2 text-sm text-ink-secondary">
                  This order remains unpaid. Resubmit a valid UTR after paying the exact amount.
                </p>
                {order.rejection_reason ? (
                  <p className="mt-2 text-sm text-ink">
                    <span className="font-semibold">{t.rejectionReason}: </span>
                    {order.rejection_reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {canResubmit ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface-card">
                <div className={styles.sum} style={{ padding: '16px 20px' }}>
                  <div>
                    <p className={styles.lbl}>{t.amountLabel || 'Total to pay'}</p>
                    <p className={styles.amt}>{amountLabel}</p>
                  </div>
                  <span className={styles.tag}>Resubmit</span>
                </div>

                <section className={`${styles.pay} ${styles.desktopPay}`}>
                  <div className={styles.tabs} role="tablist">
                    <button type="button" className={styles.tab} aria-selected={tab === 'qr'} onClick={() => setTab('qr')}>
                      {t.scanTab || 'Scan QR'}
                    </button>
                    <button type="button" className={styles.tab} aria-selected={tab === 'upi'} onClick={() => setTab('upi')}>
                      {t.upiTab || 'UPI ID'}
                    </button>
                  </div>
                  <div className={styles.panel} hidden={tab !== 'qr'}>
                    <div className={styles.frame}>
                      {qrSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.frameImg} src={qrSrc} alt={t.qrAlt} width={148} height={148} />
                      ) : (
                        <p className={styles.qrMissing}>{t.qrMissing}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.panel} hidden={tab !== 'upi'}>
                    <div className={styles.idbox}>
                      <span>{t.payToUpi || 'Pay to this UPI ID'}</span>
                      <div className={styles.idRow}>
                        <strong>{paymentInfo.upi_id || '—'}</strong>
                        {paymentInfo.upi_id ? (
                          <button
                            className={`${styles.btn2} ${copied ? styles.btn2Done : ''}`}
                            type="button"
                            onClick={() => void copyUpi()}
                          >
                            {copied ? t.copiedShort || 'Copied' : t.copyUpi}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${styles.pay} ${styles.mobilePay}`}>
                  <p className={styles.mobileLead}>{t.paySecurely || 'Pay securely using UPI'}</p>
                  <button type="button" className={styles.payNow} disabled={!upiValid} onClick={() => setAppSheetOpen(true)}>
                    {t.payNow || 'Pay Now'}
                  </button>
                </section>

                <section className={styles.verify}>
                  {awaitingUtr ? <p className={styles.returnPrompt}>{t.completedPaymentPrompt}</p> : null}
                  <label htmlFor="resubmit-utr">{t.transactionLabel}</label>
                  <input
                    id="resubmit-utr"
                    className={`${styles.input} ${utrReady ? styles.inputGood : ''}`}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={t.utrPlaceholder || 'Enter 12-digit ID'}
                    value={txn}
                    disabled={submitting}
                    onChange={(event) => setTxn(event.target.value.replace(/\D/g, '').slice(0, 12))}
                  />
                  <button
                    className={styles.go}
                    type="button"
                    disabled={submitting || !upiValid || !utrReady}
                    onClick={() => void onResubmit()}
                  >
                    {submitting ? '…' : t.resubmit}
                  </button>
                </section>
              </div>
            ) : null}

            <ul className="mt-6 space-y-3 border-t border-line pt-4">
              {(order.items || []).map((item: any, idx: number) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {item.product_name} × {item.quantity}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatCurrency((item.unit_price_paise || 0) / 100)} each
                      {item.line_points ? ` · ${item.line_points} pts` : ''}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCurrency((item.line_total_paise || 0) / 100)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total_inr)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Points {paid ? 'earned' : 'after approval'}: {order.total_points}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button variant="outline">Continue shopping</Button>
              </Link>
              {paid ? (
                <Link href="/user/points">
                  <Button>View points</Button>
                </Link>
              ) : null}
              <Link href="/user/orders">
                <Button variant="outline">All orders</Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />

      {appSheetOpen ? (
        <div className={styles.sheetRoot} role="presentation">
          <button
            type="button"
            className={styles.sheetBackdrop}
            aria-label={t.cancel || 'Cancel'}
            disabled={!!openingApp}
            onClick={() => !openingApp && setAppSheetOpen(false)}
          />
          <div className={styles.sheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle} aria-hidden="true" />
            <h2 className={styles.sheetTitle}>{t.chooseUpiApp || 'Choose UPI App'}</h2>
            <div className={styles.sheetAmount}>
              <span>{t.amountLabel || 'Amount'}</span>
              <strong>{amountLabel}</strong>
            </div>
            <ul className={styles.appList}>
              {UPI_APPS.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    className={styles.appBtn}
                    disabled={!!openingApp || !upiValid}
                    onClick={() => void openSelectedApp(app.id)}
                  >
                    {openingApp === app.id ? '…' : t[app.labelKey] || app.id}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.sheetCancel} disabled={!!openingApp} onClick={() => setAppSheetOpen(false)}>
              {t.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
