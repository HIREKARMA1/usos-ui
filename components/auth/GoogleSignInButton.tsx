'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.1 35.8 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  label: string;
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
  disabled?: boolean;
};

/** Custom-styled shell; invisible Google button on top handles OAuth (same pattern as Lakshya). */
export function GoogleSignInButton({ label, onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(el.offsetWidth, 200));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`relative h-12 w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="absolute inset-0 z-20 overflow-hidden opacity-[0.01]">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          type="standard"
          theme="outline"
          size="large"
          width={width}
          text="continue_with"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
        aria-hidden
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </div>
    </div>
  );
}
