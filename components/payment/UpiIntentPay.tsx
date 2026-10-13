'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/payment/payment.module.css';

export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'generic';

const ANDROID_PACKAGES: Record<Exclude<UpiApp, 'generic'>, string> = {
  gpay: 'com.google.android.apps.nbu.paisa.user',
  phonepe: 'com.phonepe.app',
  paytm: 'net.one97.paytm',
};

const IOS_PREFIX: Record<Exclude<UpiApp, 'generic'>, string> = {
  gpay: 'gpay://upi/pay?',
  phonepe: 'phonepe://pay?',
  paytm: 'paytmmp://pay?',
};

function detectDirectUpi() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPadOs = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const phone = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || iPadOs;
  const narrow = window.matchMedia('(max-width: 1024px)').matches;
  return phone || narrow;
}

export function useDirectUpi(): boolean {
  const [direct, setDirect] = useState(detectDirectUpi);
  useEffect(() => {
    const update = () => setDirect(detectDirectUpi());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return direct;
}

export function upiLaunchUrl(canonical: string, app: UpiApp): string {
  if (app === 'generic' || typeof navigator === 'undefined') return canonical;
  const query = canonical.split('?')[1] || '';
  if (!query) return canonical;
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) {
    const pkg = ANDROID_PACKAGES[app];
    return `intent://pay?${query}#Intent;scheme=upi;package=${pkg};end`;
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return `${IOS_PREFIX[app]}${query}`;
  }
  return canonical;
}

const RETURN_PREFIX = 'usos-upi-awaiting:';

export function markUpiAwaiting(orderId: string) {
  window.sessionStorage.setItem(`${RETURN_PREFIX}${orderId}`, '1');
}

export function clearUpiAwaiting(orderId: string) {
  window.sessionStorage.removeItem(`${RETURN_PREFIX}${orderId}`);
}

export function isUpiAwaiting(orderId: string) {
  return window.sessionStorage.getItem(`${RETURN_PREFIX}${orderId}`) === '1';
}

/** Opens a UPI link. Resolves unsupported when the page stays visible. */
export function openUpiUrl(url: string): Promise<'opened' | 'unsupported'> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: 'opened' | 'unsupported') => {
      if (settled) return;
      settled = true;
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onBlur);
      window.clearTimeout(timer);
      resolve(result);
    };
    const onHide = () => {
      if (document.hidden) finish('opened');
    };
    const onBlur = () => finish('opened');
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onBlur);
    const timer = window.setTimeout(() => finish(document.hidden ? 'opened' : 'unsupported'), 2200);
    try {
      window.location.assign(url);
    } catch {
      finish('unsupported');
    }
  });
}

type UpiIntentPayProps = {
  upiId: string;
  upiIdLabel: string;
  amountLabel: string;
  enterAmount: string;
  reference: string;
  payNowLabel: string;
  chooseLabel: string;
  hint: string;
  notice: string;
  copyLabel: string;
  copiedLabel: string;
  apps: { id: UpiApp; label: string }[];
  cancelLabel: string;
  onLaunch: (app: UpiApp) => void;
  launching: boolean;
  showLaunch?: boolean;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function UpiIntentPay({
  upiId,
  upiIdLabel,
  amountLabel,
  enterAmount,
  reference,
  payNowLabel,
  chooseLabel,
  hint,
  notice,
  copyLabel,
  copiedLabel,
  apps,
  cancelLabel,
  onLaunch,
  launching,
  showLaunch = true,
}: UpiIntentPayProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const ok = await copyText(upiId);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const copyBox = upiId ? (
    <div className={styles.idbox}>
      <span>{upiIdLabel}</span>
      <div className={styles.idRow}>
        <strong>{upiId}</strong>
        <button className={copied ? `${styles.btn2} ${styles.btn2Done}` : styles.btn2} type="button" onClick={() => void onCopy()}>
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <p className={styles.note}>{enterAmount}</p>
    </div>
  ) : null;

  return (
    <section className={styles.pay}>
      <p className={styles.phoneNotice}>{notice}</p>
      {copyBox}
      <p className={styles.mobileLead}>{hint}</p>
      {reference ? (
        <p className={styles.reference}>
          <span>{reference}</span>
        </p>
      ) : null}
      {showLaunch ? (
        <button className={styles.payNow} type="button" disabled={launching} onClick={() => setOpen(true)}>
          {payNowLabel}
        </button>
      ) : null}
      {open && showLaunch ? (
        <div className={styles.sheetRoot} role="presentation">
          <button className={styles.sheetBackdrop} type="button" aria-label={cancelLabel} onClick={() => setOpen(false)} />
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="upi-sheet-title">
            <div className={styles.sheetHandle} />
            <h2 id="upi-sheet-title" className={styles.sheetTitle}>
              {chooseLabel}
            </h2>
            <p className={styles.sheetSub}>{enterAmount}</p>
            {copyBox}
            <div className={styles.sheetAmount}>
              <span>{reference}</span>
              <strong>{amountLabel}</strong>
            </div>
            <ul className={styles.appList}>
              {apps.map((app) => (
                <li key={app.id}>
                  <button
                    className={styles.appBtn}
                    type="button"
                    disabled={launching}
                    onClick={() => {
                      setOpen(false);
                      onLaunch(app.id);
                    }}
                  >
                    {app.label}
                  </button>
                </li>
              ))}
            </ul>
            <button className={styles.sheetCancel} type="button" onClick={() => setOpen(false)}>
              {cancelLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
