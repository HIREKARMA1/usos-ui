'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { needsPayment, PAYMENT_PATH } from '@/lib/access';

export function PaymentGuard({
  children,
  allowGuest = false,
}: {
  children: ReactNode;
  allowGuest?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!allowGuest) router.replace('/login');
      return;
    }
    if (needsPayment(user)) {
      router.replace(`${PAYMENT_PATH}?reason=pending`);
    }
  }, [loading, user, allowGuest, router]);

  if (loading) {
    if (allowGuest) return <>{children}</>;
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    if (allowGuest) return <>{children}</>;
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (needsPayment(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

export function ShopPaymentGuard({ children }: { children: ReactNode }) {
  return <PaymentGuard allowGuest>{children}</PaymentGuard>;
}
