import { Suspense } from 'react';
import { AuthShell } from '@/components/layout/PublicShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
