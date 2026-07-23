'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

export function PayUCheckoutForm({
  action,
  fields,
  buttonLabel,
  autoSubmit = true,
}: {
  action: string;
  fields: Record<string, string>;
  buttonLabel: string;
  autoSubmit?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (autoSubmit && formRef.current && action) {
      formRef.current.submit();
    }
  }, [autoSubmit, action]);

  return (
    <form ref={formRef} method="POST" action={action} className="mt-6">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value ?? ''} />
      ))}
      <Button type="submit" className="w-full" variant="accent">
        {buttonLabel}
      </Button>
    </form>
  );
}
