import { useEffect, useState } from 'react';
import { isFreeWindow, freeWindowMsLeft, formatCountdown, freeWindowTextLabel } from '../lib/promo';
import { cn } from '../lib/utils';

type Props = {
  className?: string;
  compact?: boolean;
};

/** Free-pass ticket stub. Reads like a stamp, not a SaaS banner. */
export function FreeCountdown({ className, compact = false }: Props) {
  const [msLeft, setMsLeft] = useState(() => freeWindowMsLeft());
  const free = isFreeWindow();

  useEffect(() => {
    if (!free) return;
    const id = window.setInterval(() => setMsLeft(freeWindowMsLeft()), 1000);
    return () => window.clearInterval(id);
  }, [free]);

  if (!free) return null;

  const t = formatCountdown(msLeft);
  const cells = [
    { value: t.days, label: 'D' },
    { value: t.hours, label: 'H' },
    { value: t.minutes, label: 'M' },
    { value: t.seconds, label: 'S' },
  ];

  return (
    <div
      className={cn(
        'border border-dashed border-hibiscus bg-hibiscus/10',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="type-meta text-hibiscus">Free pass</p>
        <p className="type-meta">Ends {freeWindowTextLabel()}</p>
      </div>
      <div className="flex items-stretch gap-1">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex-1 border border-line bg-ink px-1 py-1.5 text-center"
          >
            <div
              className={cn(
                'font-mono font-bold tabular-nums text-bone leading-none',
                compact ? 'text-base' : 'text-xl'
              )}
            >
              {String(cell.value).padStart(2, '0')}
            </div>
            <div className="type-meta mt-1 text-[9px]">{cell.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
