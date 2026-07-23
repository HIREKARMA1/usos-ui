'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { roleHome } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

/** Blocks login/register for already authenticated users — sends them to their dashboard. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.replace(roleHome(user.role));
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
