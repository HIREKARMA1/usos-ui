'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { resolveUploadUrl } from '@/lib/media';
import { PaymentQr } from '@/components/payment/PaymentQr';
import { ManualUpiPay } from '@/components/payment/ManualUpiPay';
import { useDirectUpi } from '@/components/payment/UpiIntentPay';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import styles from '@/app/payment/payment.module.css';

type ShopUpiCheckout = {
  mode?: string;
  upi_id?: string;
  display_name?: string;
  qr_code_url?: string | null;
  instructions?: string[];
  amount_paise?: number;
  amount_inr?: number;
  note?: string;
  payment_reference?: string | null;
  upi_intent_url?: string | null;
  intent_ready?: boolean;
};

function errorDetail(err: unknown, fallback: string) {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
    return String((detail[0] as { msg?: string }).msg || fallback);
  }
  return fallback;
}

export default function CheckoutPage() {
  const t = useContent('auth').payment;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedUtr, setSubmittedUtr] = useState<string | null>(null);
  const [upi, setUpi] = useState<ShopUpiCheckout | null>(null);
  const [txn, setTxn] = useState('');
  const [continuing, setContinuing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const directUpi = useDirectUpi();

  useEffect(() => {
    setMounted(true);
  }, []);
  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
  });

  useEffect(() => {
    if (params.get('payment') === 'failed') {
      toast.error(params.get('message') || 'Payment failed');
    }
  }, [params]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/shop/checkout');
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([api.getCart(), api.getMyProfile().catch(() => null)])
      .then(([c, profile]) => {
        if (cancelled) return;
        setCart(c);
        if (!c?.items?.length) {
          router.replace('/shop/cart');
          return;
        }
        setForm({
          shipping_name: profile?.full_name || user.name || '',
          shipping_phone: profile?.phone || '',
          shipping_address: profile?.address_line || '',
          shipping_city: profile?.address_locality || '',
          shipping_state: profile?.address_state || '',
          shipping_pincode: profile?.address_pincode || '',
        });
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast.error(e?.response?.data?.detail || 'Could not load cart');
        router.replace('/shop/cart');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  // Amount always from backend order checkout — never from cart or URL.
  const amountInr = upi
    ? typeof upi.amount_inr === 'number'
      ? upi.amount_inr
      : (upi.amount_paise || 0) / 100
    : 0;
  const amountLabel = upi ? formatCurrency(amountInr) : '';

  const pending = orderStatus === 'pending_approval';
  const paid = orderStatus === 'paid' || orderStatus === 'fulfilled';
  const rejected = orderStatus === 'rejected';

  const qrSrc = useMemo(() => resolveUploadUrl(upi?.qr_code_url), [upi?.qr_code_url]);
  const scannerReady = Boolean(qrSrc);
  const intentReady = Boolean(upi?.intent_ready && upi?.upi_intent_url);
  const manualUpiReady = Boolean(upi?.upi_id);
  const showMobileManual = mounted && directUpi && !pending && !paid;
  const showDesktopQr = !showMobileManual;
  const payReady = showMobileManual ? manualUpiReady : scannerReady || intentReady;
  const canSubmit = !!orderId && !!upi && !pending && !paid;
  const utrLen = txn.length;
  const utrReady = utrLen === 12;

  const refreshOrder = useCallback(async (id: string) => {
    const order = await api.getShopOrder(id);
    setOrderStatus(order.status);
    setSubmittedUtr(order.transaction_id || null);
    setRejectionReason(order.rejection_reason || null);
    return order;
  }, []);

  useEffect(() => {
    if (!orderId || orderStatus !== 'pending_approval') return;
    const timer = window.setInterval(() => {
      void refreshOrder(orderId).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [orderId, orderStatus, refreshOrder]);

  async function onSubmitAddress(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await api.checkoutShop(form);
      const checkout = (order.checkout || {}) as ShopUpiCheckout;
      if (checkout.mode === 'upi_qr' || order.provider === 'upi') {
        setOrderId(order.shop_order_id || order.order_id);
        setOrderStatus('created');
        setUpi(checkout);
        setTxn('');
        toast.success('Order created. Pay the exact amount shown, then submit your UTR.');
      } else {
        toast.error('UPI checkout is unavailable');
      }
    } catch (err: unknown) {
      toast.error(errorDetail(err, 'Checkout failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitPayment(event?: FormEvent) {
    event?.preventDefault();
    if (!orderId) return;
    const value = txn.trim();
    if (value.length !== 12) {
      toast.error(t.invalidTxn);
      return;
    }
    setPaying(true);
    try {
      await api.submitShopUpiPayment(orderId, value);
      toast.success(t.submittedTitle);
      router.replace('/user/orders?payment=submitted');
    } catch (err: unknown) {
      toast.error(errorDetail(err, 'Could not submit payment'));
    } finally {
      setPaying(false);
    }
  }

  async function onContinue() {
    if (!orderId) return;
    setContinuing(true);
    try {
      const order = await refreshOrder(orderId);
      if (order.status !== 'paid' && order.status !== 'fulfilled') {
        toast.error(t.pendingBody);
        setContinuing(false);
        return;
      }
      router.replace(`/shop/orders/${orderId}`);
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.error));
      setContinuing(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (upi && orderId) {
    const cardClass = pending || paid ? `${styles.card} ${styles.submitted}` : styles.card;
    const shownUtr = submittedUtr || txn;

    const utrSection = canSubmit ? (
      <section className={styles.verify} id="utr-section">
        <label htmlFor="shop-utr">{t.transactionLabel}</label>
        <p className={styles.hint}>{t.utrHint || 'After paying, copy the 12-digit ID from your payment receipt.'}</p>
        <input
          id="shop-utr"
          className={`${styles.input} ${utrReady ? styles.inputGood : ''}`}
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          placeholder={t.utrPlaceholder || 'Enter 12-digit ID'}
          value={txn}
          disabled={paying || !payReady}
          onChange={(event) => setTxn(event.target.value.replace(/\D/g, '').slice(0, 12))}
        />
        <p className={styles.msg} aria-live="polite">
          {utrLen > 0 && utrLen < 12
            ? (t.moreDigits || '{n} more digit{s}')
                .replace('{n}', String(12 - utrLen))
                .replace('{s}', 12 - utrLen > 1 ? 's' : '')
            : ''}
        </p>
        <button
          className={styles.go}
          type="button"
          disabled={paying || !payReady || !utrReady}
          onClick={() => void onSubmitPayment()}
        >
          {paying ? '…' : rejected ? t.resubmit : t.submit}
        </button>
      </section>
    ) : null;

    return (
      <div className={styles.page}>
        <div className={styles.wrap}>
          <div className={styles.col}>
            <main className={cardClass}>
              <div className={styles.main}>
                <div className={styles.sum}>
                  <div>
                    <p className={styles.lbl}>{t.amountLabel || 'Total to pay'}</p>
                    <p className={styles.amt}>{amountLabel || '—'}</p>
                  </div>
                  <span className={styles.tag}>Shop order</span>
                </div>
                <div className={styles.tear} aria-hidden="true" />

                {rejected ? (
                  <div className={`${styles.alert} ${styles.alertError}`} role="status">
                    <span className={`${styles.statusPill} ${styles.statusRejected}`}>{t.statusRejected || 'Rejected'}</span>
                    <p>
                      <strong>{t.rejectedTitle}</strong>
                    </p>
                    <p className={styles.note} style={{ marginTop: 6 }}>
                      {t.rejectedBody}
                    </p>
                    {rejectionReason ? (
                      <p className={styles.note} style={{ marginTop: 6 }}>
                        <strong>{t.rejectionReason}: </strong>
                        {rejectionReason}
                      </p>
                    ) : null}
                  </div>
                ) : null}

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
                      upiId={upi.upi_id || ''}
                      upiIdLabel={t.upiIdLabel}
                      copyLabel={t.copyUpi}
                      copiedLabel={t.copiedShort || t.copied}
                      amountLabel={amountLabel}
                      amountCaption={t.amountLabel || 'Total to pay'}
                      reference={upi.payment_reference || ''}
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

                {showDesktopQr && upi.payment_reference && canSubmit ? (
                  <p className={styles.referenceLine}>
                    {t.referenceLabel || 'Payment reference'}: <b>{upi.payment_reference}</b>
                  </p>
                ) : null}

                {utrSection}
              </div>

              <div className={styles.okView}>
                {paid ? (
                  <>
                    <span className={`${styles.statusPill} ${styles.statusApproved}`}>{t.statusApproved || 'Approved'}</span>
                    <div className={styles.tick}>✓</div>
                    <h2>{t.approvedTitle}</h2>
                    <p>{t.approvedBody}</p>
                    {shownUtr ? (
                      <p style={{ marginTop: 8 }}>
                        {t.transactionLabel}: <b>{shownUtr}</b>
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className={styles.continueBtn}
                      disabled={continuing}
                      onClick={() => void onContinue()}
                    >
                      {continuing ? '…' : t.continue}
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`${styles.statusPill} ${styles.statusPending}`}>{t.statusPending || 'Pending'}</span>
                    <div className={styles.tick}>✓</div>
                    <h2>{t.paymentSubmittedTitle || 'Payment submitted'}</h2>
                    <p>
                      {t.checkingUtrPrefix || "We're checking UTR"} <b>{shownUtr || '—'}</b>
                      {t.checkingUtrSuffix || ". You'll get access once it's verified."}
                    </p>
                    <p className={styles.note} style={{ marginTop: 12 }}>
                      {t.pendingBody}
                    </p>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container grid gap-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h1 className="font-display text-2xl font-extrabold">Delivery address</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmitAddress}>
            {(
              [
                ['shipping_name', 'Full name'],
                ['shipping_phone', 'Phone'],
                ['shipping_address', 'Address'],
                ['shipping_city', 'City'],
                ['shipping_state', 'State'],
                ['shipping_pincode', 'PIN code'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-ink">{label}</span>
                <input
                  required
                  className="mt-1 min-h-12 w-full rounded-lg border border-line bg-surface-card px-3 py-2.5 text-base text-ink placeholder:text-ink-muted"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <Button type="submit" className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-center leading-snug" loading={submitting} variant="accent">
              Continue to UPI payment · {formatCurrency((cart?.total_paise || 0) / 100)}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {(cart?.items || []).map((item: any) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.product?.name} × {item.quantity}
                </span>
                <span>{formatCurrency((item.line_total_paise || 0) / 100)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency((cart?.total_paise || 0) / 100)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Earn {cart?.total_points || 0} points after payment is approved
            </p>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
