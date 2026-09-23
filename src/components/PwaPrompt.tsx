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
          className="fixed bottom-28 inset-x-4 z-[70] pointer-events-auto max-w-sm mx-auto"
        >
          <div className="glass-panel p-4 rounded-3xl flex items-center gap-3 border border-line shadow-2xl shadow-black/50">
            <div className="w-12 h-12 rounded-2xl bg-rose/15 text-rose flex items-center justify-center shrink-0">
              <Download size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-cream font-bold text-base leading-tight">Install MingleKE</h3>
              <p className="text-mist text-sm leading-snug">Add it to your home screen and open like an app.</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={handleInstall}
                className="bg-rose text-white px-3.5 py-2 rounded-xl font-bold text-sm hover:bg-rose-deep active:scale-95 transition-all"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="text-mist hover:text-cream transition-colors p-1 self-end"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
