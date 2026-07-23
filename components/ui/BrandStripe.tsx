export function BrandStripe({ className = '' }: { className?: string }) {
  return (
    <div className={`brand-stripe ${className}`} aria-hidden>
      <div>
        <span className="flex-1 bg-brand-blue" />
        <span className="flex-1 bg-brand-sky" />
        <span className="flex-1 bg-brand-yellow" />
        <span className="flex-1 bg-brand-orange" />
        <span className="flex-1 bg-brand-red" />
        <span className="flex-1 bg-brand-green" />
      </div>
    </div>
  );
}
