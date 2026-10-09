export type UpiAppId = 'gpay' | 'phonepe' | 'paytm' | 'other';

export type UpiPaymentParams = {
  upiId: string;
  merchantName: string;
  amount: number;
  note?: string | null;
};

export type UpiValidationError =
  | 'missing_upi_id'
  | 'missing_merchant'
  | 'missing_amount'
  | 'invalid_amount';

/** Format amount for UPI `am` (rupees, up to 2 decimal places, no trailing .00). */
export function formatUpiAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function validateUpiPaymentParams(params: UpiPaymentParams): UpiValidationError | null {
  if (!params.upiId?.trim()) return 'missing_upi_id';
  if (!params.merchantName?.trim()) return 'missing_merchant';
  if (params.amount == null || params.amount === undefined) return 'missing_amount';
  if (!Number.isFinite(params.amount) || params.amount <= 0) return 'invalid_amount';
  return null;
}

/**
 * Standard UPI deep-link with merchant, amount, and INR.
 * Amount must come from trusted backend checkout data — never from the URL query.
 */
export function generateUpiPaymentUrl(params: UpiPaymentParams): string {
  const error = validateUpiPaymentParams(params);
  if (error) {
    throw new Error(`Cannot generate UPI URL: ${error}`);
  }

  const am = formatUpiAmount(params.amount);
  const search = new URLSearchParams();
  search.set('pa', params.upiId.trim());
  search.set('pn', params.merchantName.trim());
  search.set('am', am);
  search.set('cu', 'INR');
  if (params.note?.trim()) {
    search.set('tn', params.note.trim());
  }

  // URLSearchParams encodes spaces as +, which some UPI apps mishandle; use %20.
  return `upi://pay?${search.toString().replace(/\+/g, '%20')}`;
}

/** App-specific schemes where supported; always fall back to upi://pay. */
export function generateUpiAppUrl(app: UpiAppId, params: UpiPaymentParams): string {
  const base = generateUpiPaymentUrl(params);
  const query = base.slice('upi://pay?'.length);

  switch (app) {
    case 'gpay':
      // tez:// is the widely supported Google Pay (Tez) scheme on Android.
      return `tez://upi/pay?${query}`;
    case 'phonepe':
      return `phonepe://pay?${query}`;
    case 'paytm':
      return `paytmmp://pay?${query}`;
    case 'other':
    default:
      return base;
  }
}

export function qrCodeImageUrl(upiLink: string, size = 188): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
}

/**
 * Try opening a UPI app deep link. If the page stays visible, the app is
 * likely missing — resolve false so the UI can show a fallback message.
 */
export function openUpiDeepLink(url: string, timeoutMs = 2200): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    let settled = false;
    const started = Date.now();

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      resolve(ok);
    };

    const onHide = () => finish(true);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') finish(true);
    };

    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onHide);
    document.addEventListener('visibilitychange', onVisibility);

    try {
      window.location.href = url;
    } catch {
      finish(false);
      return;
    }

    window.setTimeout(() => {
      const stillHere =
        document.visibilityState === 'visible' && Date.now() - started >= timeoutMs - 100;
      finish(!stillHere);
    }, timeoutMs);
  });
}
