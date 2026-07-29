import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** HireKarma yellow highlighter stroke behind the lower portion of text. */
export function HighlightMark({
  children,
  className,
  nowrap = true,
}: {
  children: ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  return (
    <span
      className={cn(nowrap && 'whitespace-nowrap', className)}
      style={{
        backgroundImage:
          'linear-gradient(transparent 65%, #fec40d 65%, #fec40d 95%, transparent 95%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        padding: '0 0.05em',
      }}
    >
      {children}
    </span>
  );
}

export function withHighlightMark(
  text: string,
  mark?: string | null,
  options?: { nowrap?: boolean; className?: string }
): ReactNode {
  if (!mark) return text;
  const index = text.indexOf(mark);
  if (index === -1) {
    return (
      <>
        {text}{' '}
        <HighlightMark nowrap={options?.nowrap} className={options?.className}>
          {mark}
        </HighlightMark>
      </>
    );
  }
  return (
    <>
      {text.slice(0, index)}
      <HighlightMark nowrap={options?.nowrap} className={options?.className}>
        {mark}
      </HighlightMark>
      {text.slice(index + mark.length)}
    </>
  );
}
