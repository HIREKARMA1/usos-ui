import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Table({
  headers,
  children,
  empty,
  tableClassName,
  headerCellClassNames,
  colGroup,
}: {
  headers: string[];
  children: ReactNode;
  empty?: ReactNode;
  tableClassName?: string;
  headerCellClassNames?: Array<string | undefined>;
  colGroup?: ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full min-w-[640px] border-collapse text-left text-sm', tableClassName)}>
        {colGroup}
        <thead>
          <tr className="border-b border-line bg-surface-muted/60">
            {headers.map((h, idx) => (
              <th
                key={`${h}-${idx}`}
                className={cn('px-3 py-3 font-semibold text-ink-secondary', headerCellClassNames?.[idx])}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-b border-line/80 last:border-0', className)}>{children}</tr>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-3 py-3 text-ink', className)}>{children}</td>;
}
