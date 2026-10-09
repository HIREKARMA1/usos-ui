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
import {
  generateUpiAppUrl,
  generateUpiPaymentUrl,
  openUpiDeepLink,
  qrCodeImageUrl,
  type UpiAppId,
  type UpiPaymentParams,
  validateUpiPaymentParams,
} from '@/lib/upi';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import styles from '@/app/payment/payment.module.css';

type PayTab = 'qr' | 'upi';

type ShopUpiCheckout = {
  mode?: string;
  upi_id?: string;
  display_name?: string;
  qr_code_url?: string | null;
  instructions?: string[];
  amount_paise?: number;
  amount_inr?: number;
  note?: string;
};

const UPI_APPS: { id: UpiAppId; labelKey: 'googlePay' | 'phonePe' | 'paytm' | 'otherUpiApp' }[] = [
  { id: 'gpay', labelKey: 'googlePay' },
  { id: 'phonepe', labelKey: 'phonePe' },
  { id: 'paytm', labelKey: 'paytm' },
  { id: 'other', labelKey: 'otherUpiApp' },
];

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
  const [tab, setTab] = useState<PayTab>('qr');
  const [copied, setCopied] = useState(false);
  const [appSheetOpen, setAppSheetOpen] = useState(false);
  const [openingApp, setOpeningApp] = useState<UpiAppId | null>(null);
  const [awaitingUtr, setAwaitingUtr] = useState(false);
  const [continuing, setContinuing] = useState(false);
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
  const merchantName = (upi?.display_name || '').trim() || 'USOS';

  const upiParams = useMemo<UpiPaymentParams | null>(() => {
    if (!upi) return null;
    return {
      upiId: upi.upi_id || '',
      merchantName,
      amount: amountInr,
      note: upi.note || 'Shop order',
    };
  }, [upi, merchantName, amountInr]);

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

  const pending = orderStatus === 'pending_approval';
  const paid = orderStatus === 'paid' || orderStatus === 'fulfilled';
  const rejected = orderStatus === 'rejected';
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
        setAwaitingUtr(false);
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
      const next = await api.submitShopUpiPayment(orderId, value);
      setOrderStatus(next.status);
      setSubmittedUtr(next.transaction_id || value);
      setAwaitingUtr(false);
      setTxn('');
      toast.success(t.submittedTitle);
    } catch (err: unknown) {
      toast.error(errorDetail(err, 'Could not submit payment'));
    } finally {
      setPaying(false);
    }
  }

  async function copyUpi() {
    if (!upi?.upi_id) return;
    try {
      await navigator.clipboard.writeText(upi.upi_id);
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
    let url = '';
    try {
      url = generateUpiAppUrl(app, upiParams);
    } catch {
      setOpeningApp(null);
      toast.error(t.notConfigured);
      return;
    }

    const opened = await openUpiDeepLink(url);
    setOpeningApp(null);
    setAppSheetOpen(false);
    if (opened) {
      setAwaitingUtr(true);
      return;
    }

    if (app !== 'other') {
      try {
        const fallbackOpened = await openUpiDeepLink(generateUpiPaymentUrl(upiParams));
        if (fallbackOpened) {
          setAwaitingUtr(true);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    toast.error(t.appNotAvailable || 'This UPI app is not available on your device. Please choose another UPI app.');
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
        {awaitingUtr ? (
          <p className={styles.returnPrompt}>
            {t.completedPaymentPrompt ||
              'Have you completed the payment? Enter your UPI Transaction ID / UTR number below.'}
          </p>
        ) : null}
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
          disabled={paying || !upiValid}
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
          disabled={paying || !upiValid || !utrReady}
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

                {/* Desktop / tablet: dynamic QR with amount baked into UPI URI */}
                <section className={`${styles.pay} ${styles.desktopPay}`}>
                  <div className={styles.tabs} role="tablist">
                    <button
                      role="tab"
                      type="button"
                      className={styles.tab}
                      aria-selected={tab === 'qr'}
                      onClick={() => setTab('qr')}
                    >
                      {t.scanTab || 'Scan QR'}
                    </button>
                    <button
                      role="tab"
                      type="button"
                      className={styles.tab}
                      aria-selected={tab === 'upi'}
                      onClick={() => setTab('upi')}
                    >
                      {t.upiTab || 'UPI ID'}
                    </button>
                  </div>

                  <div className={styles.panel} hidden={tab !== 'qr'}>
                    <div className={styles.frame}>
                      <b className={styles.corner} />
                      <b className={styles.corner} />
                      <b className={styles.corner} />
                      <b className={styles.corner} />
                      {qrSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.frameImg} src={qrSrc} alt={t.qrAlt} width={148} height={148} />
                      ) : (
                        <p className={styles.qrMissing}>{t.qrMissing}</p>
                      )}
                    </div>
                    {upi.upi_id ? (
                      <p className={styles.upiIdLine}>
                        {t.upiIdLabel || 'UPI ID'}: <strong>{upi.upi_id}</strong>
                      </p>
                    ) : null}
                  </div>

                  <div className={styles.panel} hidden={tab !== 'upi'}>
                    <div className={styles.idbox}>
                      <span>{t.payToUpi || 'Pay to this UPI ID'}</span>
                      <div className={styles.idRow}>
                        <strong>{upi.upi_id || '—'}</strong>
                        {upi.upi_id ? (
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
                    <p className={styles.note}>
                      {t.amountAutoFilled || 'Amount is automatically populated in your UPI app.'}
                    </p>
                    {!upiValid ? <p className={`${styles.note} ${styles.msgBad}`}>{t.notConfigured}</p> : null}
                  </div>
                </section>

                {/* Mobile: Google Pay / PhonePe / Paytm / Other */}
                <section className={`${styles.pay} ${styles.mobilePay}`}>
                  <p className={styles.mobileLead}>{t.paySecurely || 'Pay securely using UPI'}</p>
                  <p className={styles.note}>
                    {t.amountAutoFilled || 'Amount is automatically populated in your UPI app.'}
                  </p>
                  {upi.upi_id ? (
                    <p className={styles.upiIdLine}>
                      {t.upiIdLabel || 'UPI ID'}: <strong>{upi.upi_id}</strong>
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={styles.payNow}
                    disabled={!upiValid || pending || paid}
                    onClick={() => setAppSheetOpen(true)}
                  >
                    {t.payNow || 'Pay Now'}
                  </button>
                  {!upiValid ? <p className={`${styles.note} ${styles.msgBad}`}>{t.notConfigured}</p> : null}
                </section>

                {utrSection}
              </div>

              <div className={styles.okView}>
                {paid ? (
                  <>
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

        {appSheetOpen ? (
          <div className={styles.sheetRoot} role="presentation">
            <button
              type="button"
              className={styles.sheetBackdrop}
              aria-label={t.cancel || 'Cancel'}
              disabled={!!openingApp}
              onClick={() => !openingApp && setAppSheetOpen(false)}
            />
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="shop-upi-app-title">
              <div className={styles.sheetHandle} aria-hidden="true" />
              <h2 id="shop-upi-app-title" className={styles.sheetTitle}>
                {t.chooseUpiApp || 'Choose UPI App'}
              </h2>
              <p className={styles.sheetSub}>{t.paySecurely || 'Pay securely using UPI'}</p>
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
              <button
                type="button"
                className={styles.sheetCancel}
                disabled={!!openingApp}
                onClick={() => setAppSheetOpen(false)}
              >
                {t.cancel || 'Cancel'}
              </button>
            </div>
          </div>
        ) : null}
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
                  className="mt-1 w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <Button type="submit" className="w-full" loading={submitting} variant="accent">
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
