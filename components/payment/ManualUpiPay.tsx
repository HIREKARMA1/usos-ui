'use client';

import { useState } from 'react';
import styles from '@/app/payment/payment.module.css';

type ManualUpiPayProps = {
  upiId: string;
  upiIdLabel: string;
  copyLabel: string;
  copiedLabel: string;
  amountLabel: string;
  amountCaption: string;
  reference: string;
  referenceLabel: string;
  referenceHint: string;
  stepsTitle: string;
  steps: string[];
  missingLabel: string;
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

export function ManualUpiPay({
  upiId,
  upiIdLabel,
  copyLabel,
  copiedLabel,
  amountLabel,
  amountCaption,
  reference,
  referenceLabel,
  referenceHint,
  stepsTitle,
  steps,
  missingLabel,
}: ManualUpiPayProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!upiId) return;
    const ok = await copyText(upiId);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className={styles.manualPay}>
      {upiId ? (
        <div className={styles.idbox}>
          <span>{upiIdLabel}</span>
          <div className={styles.idRow}>
            <strong>{upiId}</strong>
            <button
              className={copied ? `${styles.btn2} ${styles.btn2Done}` : styles.btn2}
              type="button"
              onClick={() => void onCopy()}
            >
              {copied ? copiedLabel : copyLabel}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.qrMissing}>{missingLabel}</p>
      )}

      <div className={styles.manualFacts}>
        <div>
          <span>{amountCaption}</span>
          <strong>{amountLabel || '—'}</strong>
        </div>
        {reference ? (
          <div>
            <span>{referenceLabel}</span>
            <strong className={styles.manualRef}>{reference}</strong>
          </div>
        ) : null}
      </div>
      {reference ? <p className={styles.note}>{referenceHint}</p> : null}

      <div className={styles.manualSteps}>
        <p>{stepsTitle}</p>
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
