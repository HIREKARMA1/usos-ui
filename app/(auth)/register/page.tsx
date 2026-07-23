import { Suspense } from 'react';
import { AuthShell } from '@/components/layout/PublicShell';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Spinner } from '@/components/ui/Spinner';

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Spinner />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
