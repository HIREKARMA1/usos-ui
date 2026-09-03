'use client';

import { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PaymentGuard } from '@/components/auth/PaymentGuard';
import { useAuth } from '@/hooks/useAuth';

function DashboardBody({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const mode = user?.role === 'admin' ? 'admin' : 'user';
  return <DashboardShell mode={mode}>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PaymentGuard>
      <DashboardBody>{children}</DashboardBody>
    </PaymentGuard>
  );
}
