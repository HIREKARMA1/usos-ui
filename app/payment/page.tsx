'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { needsPayment, postAuthPath } from '@/lib/access';
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
import type { UpiCheckout, UpiPayment } from '@/types';
import styles from './payment.module.css';

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
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
    return String((detail[0] as { msg?: string }).msg || fallback);
  }
  return fallback;
}

function PaymentContent() {
  const t = useContent('auth').payment;
  const dash = useContent('dashboard');
  const { user, loading, loginSuccess, logout } = useAuth();
  const router = useRouter();
  const [checkout, setCheckout] = useState<UpiCheckout | null>(null);
  const [payment, setPayment] = useState<UpiPayment | null>(null);
  const [txn, setTxn] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<PayTab>('qr');
  const [copied, setCopied] = useState(false);
  const [appSheetOpen, setAppSheetOpen] = useState(false);
  const [openingApp, setOpeningApp] = useState<UpiAppId | null>(null);
  const [awaitingUtr, setAwaitingUtr] = useState(false);

  const applyCheckout = useCallback((data: UpiCheckout) => {
    setCheckout(data);
    setPayment(data.payment || null);
  }, []);

  const loadCheckout = useCallback(async () => {
    setLoadError('');
    try {
      applyCheckout(await api.getUpiCheckout());
    } catch (err: unknown) {
      setLoadError(errorDetail(err, t.error));
    } finally {
      setLoadingCheckout(false);
    }
  }, [applyCheckout, t.error]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!needsPayment(user)) {
      router.replace(postAuthPath(user));
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user || !needsPayment(user)) return;
    void loadCheckout();
  }, [loading, user, loadCheckout]);

  useEffect(() => {
    if (!payment || payment.status !== 'pending_approval') return;
    const timer = window.setInterval(() => {
      void api
        .getUpiPaymentStatus(payment.id)
        .then(async (next) => {
          setPayment(next);
          if (next.status !== 'approved') return;
          const token = getStoredToken();
          const me = await api.getMe();
          if (token) loginSuccess(token, me);
        })
        .catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [payment, loginSuccess]);

  // Amount always from backend checkout — never from the page URL.
  const amountInr = checkout
    ? checkout.amount_inr || (checkout.amount_paise || 0) / 100
    : 0;
  const amountLabel = checkout ? formatCurrency(amountInr) : '';
  const packageName = checkout?.package_name || '—';
  const merchantName = (checkout?.display_name || '').trim() || 'USOS';

  const upiParams = useMemo<UpiPaymentParams | null>(() => {
    if (!checkout) return null;
    return {
      upiId: checkout.upi_id || '',
      merchantName,
      amount: amountInr,
      note: checkout.package_name,
    };
  }, [checkout, merchantName, amountInr]);

  const upiValid = upiParams ? validateUpiPaymentParams(upiParams) === null : false;

  const upiLink = useMemo(() => {
    if (!upiParams || !upiValid) return '';
    try {
      return generateUpiPaymentUrl(upiParams);
    } catch {
      return '';
    }
  }, [upiParams, upiValid]);

  // Always encode the dynamic UPI URI (with amount) — never a static uploaded QR alone.
  const qrSrc = useMemo(() => {
    if (!upiLink) return '';
    return qrCodeImageUrl(upiLink);
  }, [upiLink]);

  const status = payment?.status;
  const pending = status === 'pending_approval';
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  const canSubmit = !pending && !approved;
  const utrLen = txn.length;
  const utrReady = utrLen === 12;

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    const value = txn.trim();
    if (value.length !== 12) {
      toast.error(t.invalidTxn);
      return;
    }
    setSubmitting(true);
    try {
      const next = await api.submitUpiPayment(value);
      setPayment(next);
      setAwaitingUtr(false);
      toast.success(t.submittedTitle);
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.error));
    } finally {
      setSubmitting(false);
    }
  }

  async function onContinue() {
    setContinuing(true);
    try {
      const token = getStoredToken();
      const me = await api.getMe();
      if (token) loginSuccess(token, me);
      if (needsPayment(me)) {
        toast.error(t.pendingBody);
        setContinuing(false);
        return;
      }
      router.replace(postAuthPath(me));
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.error));
      setContinuing(false);
    }
  }

  async function copyUpi() {
    if (!checkout?.upi_id) return;
    const ok = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };
    try {
      await navigator.clipboard.writeText(checkout.upi_id);
      ok();
    } catch {
      ok();
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

    // App-specific scheme failed — try generic upi://pay once more.
    if (app !== 'other') {
      try {
        const fallback = generateUpiPaymentUrl(upiParams);
        const fallbackOpened = await openUpiDeepLink(fallback);
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

  function onLogout() {
    logout();
    router.replace('/login');
  }

  if (loading || !user || !needsPayment(user) || (loadingCheckout && !checkout)) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  const cardClass = pending || approved ? `${styles.card} ${styles.submitted}` : styles.card;
  const shownUtr = payment?.transaction_id || txn;

  const utrSection = canSubmit ? (
    <section className={styles.verify} id="utr-section">
      {awaitingUtr ? (
        <p className={styles.returnPrompt}>
          {t.completedPaymentPrompt || 'Have you completed the payment? Enter your UPI Transaction ID / UTR number below.'}
        </p>
      ) : null}
      <label htmlFor="utr">{t.transactionLabel}</label>
      <p className={styles.hint}>
        {t.utrHint || 'After paying, copy the 12-digit ID from your payment receipt.'}
      </p>
      <input
        id="utr"
        className={`${styles.input} ${utrReady ? styles.inputGood : ''}`}
        inputMode="numeric"
        autoComplete="off"
        maxLength={12}
        placeholder={t.utrPlaceholder || 'Enter 12-digit ID'}
        value={txn}
        disabled={submitting || !upiValid}
        onChange={(event) => setTxn(event.target.value.replace(/\D/g, '').slice(0, 12))}
      />
      <p className={styles.msg} id="msg" aria-live="polite">
        {utrLen > 0 && utrLen < 12
          ? (t.moreDigits || '{n} more digit{s}')
              .replace('{n}', String(12 - utrLen))
              .replace('{s}', 12 - utrLen > 1 ? 's' : '')
          : ''}
      </p>
      <button
        className={styles.go}
        id="go"
        type="button"
        disabled={submitting || !upiValid || !utrReady}
        onClick={() => void onSubmit()}
      >
        {submitting ? '…' : rejected ? t.resubmit : t.submit}
      </button>
      <button className={styles.logout} type="button" onClick={onLogout}>
        {dash.topbar?.logout || t.logout}
      </button>
    </section>
  ) : null;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.col}>
          <main className={cardClass} id="card">
            <div className={styles.main}>
              <div className={styles.sum}>
                <div>
                  <p className={styles.lbl}>{t.amountLabel || 'Total to pay'}</p>
                  <p className={styles.amt}>{amountLabel || '—'}</p>
                </div>
                <span className={styles.tag}>{packageName}</span>
              </div>
              <div className={styles.tear} aria-hidden="true" />

              {loadError ? (
                <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                  <p>{loadError}</p>
                  <button type="button" className={styles.retryBtn} onClick={() => void loadCheckout()}>
                    {t.retry}
                  </button>
                </div>
              ) : null}

              {rejected ? (
                <div className={`${styles.alert} ${styles.alertError}`} role="status">
                  <p>
                    <strong>{t.rejectedTitle}</strong>
                  </p>
                  <p className={styles.note} style={{ marginTop: 6 }}>
                    {t.rejectedBody}
                  </p>
                  {payment?.rejection_reason ? (
                    <p className={styles.note} style={{ marginTop: 6 }}>
                      <strong>{t.rejectionReason}: </strong>
                      {payment.rejection_reason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {checkout ? (
                <>
                  {/* Desktop / tablet: dynamic QR with amount baked into UPI URI */}
                  <section className={`${styles.pay} ${styles.desktopPay}`}>
                    <div className={styles.tabs} role="tablist">
                      <button
                        role="tab"
                        id="t1"
                        type="button"
                        className={styles.tab}
                        aria-selected={tab === 'qr'}
                        aria-controls="p1"
                        onClick={() => setTab('qr')}
                      >
                        {t.scanTab || 'Scan QR'}
                      </button>
                      <button
                        role="tab"
                        id="t2"
                        type="button"
                        className={styles.tab}
                        aria-selected={tab === 'upi'}
                        aria-controls="p2"
                        onClick={() => setTab('upi')}
                      >
                        {t.upiTab || 'UPI ID'}
                      </button>
                    </div>

                    <div
                      className={styles.panel}
                      id="p1"
                      role="tabpanel"
                      aria-labelledby="t1"
                      hidden={tab !== 'qr'}
                    >
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
                      {checkout.upi_id ? (
                        <p className={styles.upiIdLine}>
                          {t.upiIdLabel || 'UPI ID'}: <strong>{checkout.upi_id}</strong>
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={styles.panel}
                      id="p2"
                      role="tabpanel"
                      aria-labelledby="t2"
                      hidden={tab !== 'upi'}
                    >
                      <div className={styles.idbox}>
                        <span>{t.payToUpi || 'Pay to this UPI ID'}</span>
                        <div className={styles.idRow}>
                          <strong>{checkout.upi_id || '—'}</strong>
                          {checkout.upi_id ? (
                            <button
                              className={`${styles.btn2} ${copied ? styles.btn2Done : ''}`}
                              id="copy"
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
                      {!upiValid ? (
                        <p className={`${styles.note} ${styles.msgBad}`}>{t.notConfigured}</p>
                      ) : null}
                    </div>
                  </section>

                  {/* Mobile: choose UPI app — amount from backend checkout */}
                  <section className={`${styles.pay} ${styles.mobilePay}`}>
                    <p className={styles.mobileLead}>
                      {t.paySecurely || 'Pay securely using UPI'}
                    </p>
                    <p className={styles.note}>
                      {t.amountAutoFilled || 'Amount is automatically populated in your UPI app.'}
                    </p>
                    {checkout.upi_id ? (
                      <p className={styles.upiIdLine}>
                        {t.upiIdLabel || 'UPI ID'}: <strong>{checkout.upi_id}</strong>
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className={styles.payNow}
                      disabled={!upiValid}
                      onClick={() => setAppSheetOpen(true)}
                    >
                      {t.payNow || 'Pay Now'}
                    </button>
                    {!upiValid ? (
                      <p className={`${styles.note} ${styles.msgBad}`}>{t.notConfigured}</p>
                    ) : null}
                  </section>

                  {utrSection}
                </>
              ) : (
                <section className={styles.verify}>
                  <button className={styles.logout} type="button" onClick={onLogout}>
                    {dash.topbar?.logout || t.logout}
                  </button>
                </section>
              )}
            </div>

            <div className={styles.okView}>
              {approved ? (
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
              <button className={styles.logout} type="button" onClick={onLogout}>
                {dash.topbar?.logout || t.logout}
              </button>
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
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upi-app-title"
          >
            <div className={styles.sheetHandle} aria-hidden="true" />
            <h2 id="upi-app-title" className={styles.sheetTitle}>
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

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.loading}>
            <Spinner />
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
