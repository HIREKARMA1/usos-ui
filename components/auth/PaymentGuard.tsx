'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

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
    if (!user && !allowGuest) router.replace('/login');
  }, [loading, user, allowGuest, router]);

  if (loading) {
    if (allowGuest) return <>{children}</>;
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user && !allowGuest) {
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
