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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={hide}
          className="fixed bottom-28 inset-x-4 z-[80] max-w-sm mx-auto text-left"
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
  const base =
    'w-full rounded-2xl px-4 py-3.5 text-sm font-medium border shadow-lg backdrop-blur-md';
  if (tone === 'success') return `${base} bg-sage/15 border-sage/40 text-sage`;
  if (tone === 'error') return `${base} bg-rose/15 border-rose/40 text-rose`;
  return `${base} bg-panel border-line text-cream`;
}
