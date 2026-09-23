import React from 'react';
import { WifiOff, Gauge } from 'lucide-react';
import { useNetStore } from '../lib/netStore';

/** Slim strip shown when the link is gone or crawling. */
export function NetworkBanner() {
  const online = useNetStore((s) => s.online);
  const lowBandwidth = useNetStore((s) => s.lowBandwidth);

  if (online && !lowBandwidth) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 px-3 py-2 border-b border-line bg-ink-soft type-meta text-bone"
    >
      {!online ? (
        <>
          <WifiOff size={12} className="text-hibiscus shrink-0" />
          <span className="truncate">Offline — showing cached deck</span>
        </>
      ) : (
        <>
          <Gauge size={12} className="text-amber shrink-0" />
          <span className="truncate">Slow network — lighter photos</span>
        </>
      )}
    </div>
  );
}
