'use client';

import { Sora } from 'next/font/google';
import styles from './ShopPromoBanner.module.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

/**
 * Professional network promo banner with light/dark theme support.
 */
export function ShopPromoBanner() {
  return (
    <section
      className={`${styles.banner} ${sora.variable}`}
      aria-label="A Network That Grows With You."
    >
      <div className={styles.gridBg} aria-hidden />
      <div className={styles.glowBg} aria-hidden />

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Professional Growth Network
        </div>

        <h2 className={styles.title}>
          A Network That
          <br />
          Grows <span className={styles.accent}>With You.</span>
        </h2>
        <p className={styles.sub}>
          U.S.O.S connects members into a four-wide team structure, with progress tracked across eight
          growth levels as your circle expands.
        </p>

        <div className={styles.statRow}>
          <div className={styles.stat}>
            <div className={styles.statNum}>08</div>
            <div className={styles.statLbl}>Growth levels</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>4×</div>
            <div className={styles.statLbl}>Team width</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>7D</div>
            <div className={styles.statLbl}>Qualify window</div>
          </div>
        </div>

        <div className={styles.footnote}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2l2.4 7.2H22l-6 4.4 2.4 7.2L12 16.4 5.6 20.8 8 13.6 2 9.2h7.6z" />
          </svg>
          Entry starts at ₹2,500 per membership
        </div>
      </div>

      <div className={styles.diagram} aria-hidden>
        <svg viewBox="0 0 420 400" xmlns="http://www.w3.org/2000/svg">
          <path className={styles.conn} d="M210,200 L120,110" />
          <path className={styles.conn} d="M210,200 L320,120" />
          <path className={styles.conn} d="M210,200 L310,280" />
          <path className={styles.conn} d="M210,200 L130,300" />

          <path className={styles.connFaint} d="M120,110 L60,70" />
          <path className={styles.connFaint} d="M120,110 L70,140" />
          <path className={styles.connFaint} d="M320,120 L380,80" />
          <path className={styles.connFaint} d="M320,120 L370,150" />
          <path className={styles.connFaint} d="M310,280 L370,260" />
          <path className={styles.connFaint} d="M310,280 L365,320" />
          <path className={styles.connFaint} d="M130,300 L70,280" />
          <path className={styles.connFaint} d="M130,300 L75,340" />

          <circle className={styles.nodeFillSoft} cx="60" cy="70" r="7" />
          <circle className={styles.nodeFillSoft} cx="70" cy="140" r="6" />
          <circle className={styles.nodeFillSoft} cx="380" cy="80" r="7" />
          <circle className={styles.nodeFillSoft} cx="370" cy="150" r="6" />
          <circle className={styles.nodeFillSoft} cx="370" cy="260" r="6" />
          <circle className={styles.nodeFillSoft} cx="365" cy="320" r="7" />
          <circle className={styles.nodeFillSoft} cx="70" cy="280" r="6" />
          <circle className={styles.nodeFillSoft} cx="75" cy="340" r="7" />

          <circle className={styles.nodeFillMid} cx="120" cy="110" r="22" />
          <circle className={styles.nodeRing} cx="120" cy="110" r="13" />

          <circle className={styles.nodeFillMid} cx="320" cy="120" r="22" />
          <circle className={styles.nodeRing} cx="320" cy="120" r="13" />

          <circle className={styles.nodeFillMid} cx="310" cy="280" r="22" />
          <circle className={styles.nodeRing} cx="310" cy="280" r="13" />

          <circle className={styles.nodeFillMid} cx="130" cy="300" r="22" />
          <circle className={styles.nodeRing} cx="130" cy="300" r="13" />

          <circle className={styles.nodeFillSoft} cx="210" cy="200" r="30" />
          <circle className={styles.nodeFill} cx="210" cy="200" r="17" />
          <circle className={styles.nodeRing} cx="210" cy="200" r="17" fill="none" />
        </svg>
      </div>
    </section>
  );
}
