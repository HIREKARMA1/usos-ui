export function BrandStripe({ className = '' }: { className?: string }) {
  return (
    <div className={`brand-stripe ${className}`} aria-hidden>
      <div className="brand-stripe__line" />
      <div className="brand-stripe__glow" />
    </div>
  );
}
