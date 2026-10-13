'use client';

import styles from '@/app/payment/payment.module.css';

type PaymentQrProps = {
  qrSrc: string;
  qrAlt: string;
  qrMissing: string;
  scanNote?: string;
  notConfigured?: string;
  upiValid: boolean;
};

/** Same QR on every screen size. The UPI ID is encoded in the code, not shown as text. */
export function PaymentQr({ qrSrc, qrAlt, qrMissing, scanNote, notConfigured, upiValid }: PaymentQrProps) {
  return (
    <section className={styles.pay}>
      <div className={styles.panel}>
        <div className={styles.frame}>
          <b className={styles.corner} />
          <b className={styles.corner} />
          <b className={styles.corner} />
          <b className={styles.corner} />
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.frameImg} src={qrSrc} alt={qrAlt} />
          ) : (
            <p className={styles.qrMissing}>{qrMissing}</p>
          )}
        </div>
        {scanNote ? <p className={styles.note}>{scanNote}</p> : null}
        {!upiValid && notConfigured ? <p className={`${styles.note} ${styles.msgBad}`}>{notConfigured}</p> : null}
      </div>
    </section>
  );
}
