import { create } from 'zustand';
import { AnimatePresence, motion } from 'motion/react';

type ToastTone = 'info' | 'success' | 'error';

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  show: (message, tone = 'info') => set({ message, tone }),
  hide: () => set({ message: null }),
}));

export function ToastHost() {
  const { message, tone, hide } = useToast();

  return (
    <AnimatePresence>
      {message && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          onClick={hide}
          className="fixed bottom-20 inset-x-3 sm:inset-x-4 z-[80] max-w-md mx-auto text-left"
        >
          <div
            className={cnToast(tone)}
            role="status"
          >
            {message}
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function cnToast(tone: ToastTone) {
  const base = 'w-full px-4 py-3 text-sm border font-mono uppercase tracking-wider text-[11px]';
  if (tone === 'success') return `${base} bg-moss/20 border-moss text-bone`;
  if (tone === 'error') return `${base} bg-hibiscus/15 border-hibiscus text-hibiscus`;
  return `${base} bg-ink-soft border-line text-bone`;
}
