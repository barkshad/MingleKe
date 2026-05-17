import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download } from 'lucide-react';

export function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed top-6 inset-x-4 z-50 pointer-events-auto max-w-sm mx-auto"
        >
          <div className="glass-panel p-4 rounded-[28px] flex items-center justify-between  border border-white/30 bg-[#1a0823]/90 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -z-10" />

            <div className="flex-1 pr-4">
              <h3 className="text-white font-bold text-lg mb-1 ">Install MingleKE</h3>
              <p className="text-white/70 text-sm font-medium leading-tight">Add to your home screen for a better app experience.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleInstall}
                className="bg-white text-black px-4 py-2.5 rounded-full font-bold  hover: active:scale-95 transition-all text-sm flex items-center gap-1.5 min-w-max justify-center"
              >
                <Download size={16} /> Install
              </button>
              <button 
                onClick={handleDismiss}
                className="text-white/50 text-xs text-center font-bold uppercase tracking-widest hover:text-white transition-colors py-1"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
