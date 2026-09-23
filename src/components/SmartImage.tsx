import React, { useState } from 'react';
import { platePlaceholder, cn } from '../lib/utils';
import { isLowBandwidth } from '../lib/network';
import { useNetStore } from '../lib/netStore';

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Prefer the 180px thumb when the link is slow */
  thumbSrc?: string;
  eager?: boolean;
  objectPosition?: string;
  onErrorSrc?: string;
};

export function SmartImage({
  src,
  alt,
  className,
  thumbSrc,
  eager = false,
  objectPosition,
  onErrorSrc,
}: Props) {
  const low = useNetStore((s) => s.lowBandwidth);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const useThumb = (low || isLowBandwidth()) && !!thumbSrc;
  const finalSrc = failed ? onErrorSrc || platePlaceholder() : useThumb ? thumbSrc! : src;

  return (
    <span className={cn('relative block overflow-hidden bg-ink-soft', className)}>
      {!loaded && (
        <img
          src={platePlaceholder(64, 80)}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <img
        src={finalSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
        className={cn(
          'absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        style={objectPosition ? { objectPosition } : undefined}
      />
    </span>
  );
}

export function thumbFor(src?: string): string | undefined {
  if (!src) return undefined;
  if (!src.startsWith('/seed/wa/')) return undefined;
  return src.replace('/seed/wa/', '/seed/thumbs/');
}
