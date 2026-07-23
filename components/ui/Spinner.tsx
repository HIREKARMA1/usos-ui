export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary/20 border-t-primary ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}
