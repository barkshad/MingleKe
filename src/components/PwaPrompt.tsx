import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const hasDismissed = localStorage.getItem('mingleke-pwa-dismissed');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!hasDismissed && !isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('mingleke-pwa-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-20 sm:bottom-24 inset-x-3 sm:inset-x-4 z-[70] pointer-events-auto max-w-md mx-auto"
        >
          <div className="panel p-4 flex items-center gap-3 shadow-none">
            <div className="w-10 h-10 border border-hibiscus text-hibiscus flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="type-display text-base">Install MingleKE</h3>
              <p className="type-meta mt-0.5 normal-case tracking-normal font-sans text-xs text-bone-dim">
                Home screen. Opens like an app.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstall}
                className="btn-primary !w-auto px-3 py-2 text-xs"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="type-meta p-2"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
