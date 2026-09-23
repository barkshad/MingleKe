import { useEffect } from 'react';
import { isLowBandwidth, isOnline, getConnection } from '../lib/network';
import { useNetStore } from '../lib/netStore';
import { useToast } from './Toast';

/** Watches connection quality and warns once when the network drops. */
export function NetworkWatcher() {
  const setOnline = useNetStore((s) => s.setOnline);
  const setLowBandwidth = useNetStore((s) => s.setLowBandwidth);
  const toast = useToast((s) => s.show);

  useEffect(() => {
    setOnline(isOnline());
    setLowBandwidth(isLowBandwidth());

    let announcedOffline = false;

    const onOnline = () => {
      setOnline(true);
      announcedOffline = false;
      toast('Back online.', 'success');
    };
    const onOffline = () => {
      setOnline(false);
      if (!announcedOffline) {
        announcedOffline = true;
        toast('You are offline. The deck still works from cache.', 'info');
      }
    };
    const onChange = () => setLowBandwidth(isLowBandwidth());

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const conn = getConnection() as (EventTarget & { addEventListener?: Function }) | null;
    conn?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      conn?.removeEventListener?.('change', onChange);
    };
  }, [setOnline, setLowBandwidth, toast]);

  return null;
}
