import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { isFreeWindow, freeWindowMsLeft, formatCountdown, freeWindowTextLabel } from '../lib/promo';
import { cn } from '../lib/utils';

type Props = {
  className?: string;
  compact?: boolean;
};

export function FreeCountdown({ className, compact = false }: Props) {
  const [msLeft, setMsLeft] = useState(() => freeWindowMsLeft());
  const free = isFreeWindow();

  useEffect(() => {
    if (!free) return;
    const id = window.setInterval(() => {
      setMsLeft(freeWindowMsLeft());
    }, 1000);
    return () => window.clearInterval(id);
  }, [free]);

  if (!free) return null;

  const t = formatCountdown(msLeft);
  const cells: Array<{ value: number; label: string }> = [
    { value: t.days, label: 'days' },
    { value: t.hours, label: 'hrs' },
    { value: t.minutes, label: 'min' },
    { value: t.seconds, label: 'sec' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'rounded-2xl border border-amber/40 bg-amber/10 backdrop-blur-md',
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="text-amber inline-flex"
        >
          <Sparkles size={compact ? 14 : 16} />
        </motion.span>
        <p className="text-amber font-bold text-[11px] sm:text-xs uppercase tracking-wider">
          Free for everyone — ends {freeWindowTextLabel()}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className={cn(
              'flex-1 text-center rounded-xl bg-black/30 border border-amber/20',
              compact ? 'py-1.5' : 'py-2'
            )}
          >
            <div
              className={cn(
                'font-bold tabular-nums text-cream leading-none',
                compact ? 'text-base' : 'text-xl sm:text-2xl'
              )}
            >
              {String(cell.value).padStart(2, '0')}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-amber/80 mt-1">
              {cell.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
