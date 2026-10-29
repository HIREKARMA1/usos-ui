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
import { resolveUploadUrl } from '@/lib/media';
import { PaymentQr } from '@/components/payment/PaymentQr';
import { ManualUpiPay } from '@/components/payment/ManualUpiPay';
import { useDirectUpi } from '@/components/payment/UpiIntentPay';
import type { UpiCheckout, UpiPayment } from '@/types';
import styles from './payment.module.css';

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
  const [mounted, setMounted] = useState(false);
  const directUpi = useDirectUpi();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let active = true;
    api
      .getMemberActivation()
      .then((status) => {
        if (!active) return;
        if (status.needs_repurchase) {
          router.replace('/shop?reactivate=1');
          return;
        }
        void loadCheckout();
      })
      .catch(() => {
        if (active) void loadCheckout();
      });
    return () => {
      active = false;
    };
  }, [loading, user, loadCheckout, router]);

  const orderId = checkout?.order_id || payment?.id || '';

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

  // Amount always from the server order in paise — never from the page URL.
  const amountInr = checkout ? (checkout.amount_paise || 0) / 100 : 0;
  const amountLabel = checkout ? formatCurrency(amountInr) : '';
  const packageName = checkout?.package_name || '—';

  const status = payment?.status;
  const pending = status === 'pending_approval';
  const approved = status === 'approved';
  const rejected = status === 'rejected' || Boolean(checkout?.previous_rejection_reason);

  const qrSrc = useMemo(() => resolveUploadUrl(checkout?.qr_code_url), [checkout?.qr_code_url]);
  const scannerReady = Boolean(qrSrc);
  const intentReady = Boolean(checkout?.intent_ready && checkout?.upi_intent_url);
  const manualUpiReady = Boolean(checkout?.upi_id);
  const showMobileManual = mounted && directUpi && !pending && !approved;
  const showDesktopQr = !showMobileManual;
  const payReady = showMobileManual ? manualUpiReady : scannerReady || intentReady;
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
      const next = await api.submitUpiPayment(value, orderId || undefined);
      setPayment(next);
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
        disabled={submitting || !payReady}
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
        disabled={submitting || !payReady || !utrReady}
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
                  <span className={`${styles.statusPill} ${styles.statusRejected}`}>{t.statusRejected || 'Rejected'}</span>
                  <p>
                    <strong>{t.rejectedTitle}</strong>
                  </p>
                  <p className={styles.note} style={{ marginTop: 6 }}>
                    {t.rejectedBody}
                  </p>
                  {(payment?.rejection_reason || checkout?.previous_rejection_reason) ? (
                    <p className={styles.note} style={{ marginTop: 6 }}>
                      <strong>{t.rejectionReason}: </strong>
                      {payment?.rejection_reason || checkout?.previous_rejection_reason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {checkout ? (
                <>
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
                        upiId={checkout.upi_id || ''}
                        upiIdLabel={t.upiIdLabel}
                        copyLabel={t.copyUpi}
                        copiedLabel={t.copiedShort || t.copied}
                        amountLabel={amountLabel}
                        amountCaption={t.amountLabel || 'Total to pay'}
                        reference={checkout.payment_reference || payment?.payment_reference || ''}
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

                  {showDesktopQr && checkout.payment_reference && canSubmit ? (
                    <p className={styles.referenceLine}>
                      {t.referenceLabel || 'Payment reference'}: <b>{checkout.payment_reference}</b>
                    </p>
                  ) : null}

                  {canSubmit ? utrSection : null}
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
              <button className={styles.logout} type="button" onClick={onLogout}>
                {dash.topbar?.logout || t.logout}
              </button>
            </div>
          </main>
        </div>
      </div>

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
