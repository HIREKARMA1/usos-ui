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
import { formatCurrency, formatDate, orderStatusLabel } from '@/lib/format';
import { resolveUploadUrl } from '@/lib/media';
import { PaymentQr } from '@/components/payment/PaymentQr';
import { ManualUpiPay } from '@/components/payment/ManualUpiPay';
import { useDirectUpi } from '@/components/payment/UpiIntentPay';
import { useContent } from '@/hooks/useContent';
import styles from '@/app/payment/payment.module.css';

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
  const [mounted, setMounted] = useState(false);
  const directUpi = useDirectUpi();

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
    setMounted(true);
  }, []);

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

  const pending = order?.status === 'pending_approval';
  const rejected = order?.status === 'rejected';
  const paid = order?.status === 'paid' || order?.status === 'fulfilled';
  const canResubmit = rejected && !!paymentInfo;

  const qrSrc = useMemo(() => resolveUploadUrl(paymentInfo?.qr_code_url), [paymentInfo?.qr_code_url]);
  const scannerReady = Boolean(qrSrc);
  const intentReady = Boolean(paymentInfo?.intent_ready && paymentInfo?.upi_intent_url);
  const manualUpiReady = Boolean(paymentInfo?.upi_id);
  const showMobileManual = mounted && directUpi && canResubmit;
  const showDesktopQr = canResubmit && !showMobileManual;
  const payReady = showMobileManual ? manualUpiReady : scannerReady || intentReady;
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
      toast.success(t.submittedTitle);
    } catch (err: unknown) {
      toast.error(errorDetail(err, 'Could not submit payment'));
    } finally {
      setSubmitting(false);
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
              <Badge tone={badgeTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
            </div>

            {pending ? (
              <div className="mt-5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3" role="status">
                <p className="font-semibold text-ink">Payment approval pending</p>
                <p className="mt-1 text-sm font-medium text-ink">Payment submitted successfully.</p>
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
              <div className={`${styles.payTheme} mx-auto mt-5 w-full max-w-[440px] overflow-hidden rounded-2xl border border-line bg-surface-card`}>
                <div className={styles.sum} style={{ padding: '16px 20px' }}>
                  <div>
                    <p className={styles.lbl}>{t.amountLabel || 'Total to pay'}</p>
                    <p className={styles.amt}>{amountLabel}</p>
                  </div>
                  <span className={styles.tag}>Resubmit</span>
                </div>

                {showDesktopQr ? (
                <div className={styles.desktopQr}>
                <PaymentQr
                  qrSrc={qrSrc}
                  qrAlt={t.qrAlt}
                  qrMissing={t.qrMissing}
                  scanNote={t.scanNote}
                  notConfigured={intentReady ? undefined : t.notConfigured}
                  upiValid={scannerReady || intentReady}
                />
                </div>
                ) : null}

                {showMobileManual ? (
                  <div className={styles.mobileIntent}>
                    <ManualUpiPay
                      upiId={paymentInfo?.upi_id || ''}
                      upiIdLabel={t.upiIdLabel}
                      copyLabel={t.copyUpi}
                      copiedLabel={t.copiedShort || t.copied}
                      amountLabel={amountLabel}
                      amountCaption={t.amountLabel || 'Total to pay'}
                      reference={paymentInfo?.payment_reference || ''}
                      referenceLabel={t.referenceLabel || 'Payment reference'}
                      referenceHint={t.referenceHint}
                      stepsTitle={t.manualTitle || 'How to pay'}
                      steps={[
                        t.manualStep1 || 'Open PhonePe, Google Pay, Paytm, or any other UPI app.',
                        (t.manualStep2 || 'Paste the UPI ID and pay exactly {amount}.').replace('{amount}', amountLabel),
                        t.manualStep3 ||
                          'If the app asks for a note, enter the payment reference. Then come back and submit the 12-digit UTR.',
                      ]}
                      missingLabel={t.notConfigured}
                    />
                  </div>
                ) : null}

                {showDesktopQr && paymentInfo?.payment_reference ? (
                  <p className={styles.referenceLine}>
                    {t.referenceLabel || 'Payment reference'}: <b>{paymentInfo.payment_reference}</b>
                  </p>
                ) : null}

                <section className={styles.verify}>
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
                    disabled={submitting || !payReady || !utrReady}
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
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">Continue shopping</Button>
              </Link>
              {paid ? (
                <Link href="/user/points" className="w-full sm:w-auto">
                  <Button className="w-full">View points</Button>
                </Link>
              ) : null}
              <Link href="/user/orders" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">All orders</Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />

    </div>
  );
}
