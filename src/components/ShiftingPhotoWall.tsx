import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SEED_PROFILES } from '../lib/seedProfiles';

const HERO_COUNT = 12;
const RAIL_COUNT = 28;

function pickHero() {
  return SEED_PROFILES.slice(0, HERO_COUNT);
}

function pickRail(offset: number) {
  const all = SEED_PROFILES;
  const out = [];
  for (let i = 0; i < RAIL_COUNT; i++) {
    out.push(all[(i + offset) % all.length]);
  }
  return out;
}

/**
 * Landing photo showcase: stacked hero plates that shift + dual rails that drift.
 * Signature motion: slide-through plates with a slow push-in, not a fade-only carousel.
 */
export function ShiftingPhotoWall() {
  const reduce = useReducedMotion();
  const hero = useMemo(() => pickHero(), []);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const current = hero[index % hero.length];
  const railTop = useMemo(() => pickRail(0), []);
  const railBottom = useMemo(() => pickRail(11), []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setDir(1);
      setIndex((i) => i + 1);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduce]);

  const photo = current?.photos?.[0] || '/seed/wa/p01.jpg';
  const nextPhoto = hero[(index + 1) % hero.length]?.photos?.[0] || photo;

  return (
    <div className="relative min-h-[72vh] overflow-hidden border-b border-line bg-ink">
      {/* stacked plates */}
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={`${current?.uid}-${index}`}
          custom={dir}
          initial={reduce ? { opacity: 0 } : { x: dir > 0 ? 48 : -48, opacity: 0, scale: 1.04 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { x: 0, opacity: 1, scale: 1 }
          }
          exit={
            reduce
              ? { opacity: 0 }
              : { x: dir > 0 ? -40 : 40, opacity: 0, scale: 1.02 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.7 }}
          className="absolute inset-0"
        >
          <motion.img
            src={photo}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
            initial={reduce ? false : { scale: 1.08 }}
            animate={reduce ? undefined : { scale: 1 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = '0';
            }}
          />
          {/* next plate peeking behind for depth */}
          <img
            src={nextPhoto}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-top opacity-0"
          />
        </motion.div>
      </AnimatePresence>

      {/* scrim */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #14110E 0%, rgba(20,17,14,0.55) 40%, rgba(20,17,14,0.12) 75%, rgba(20,17,14,0.35) 100%)',
        }}
      />

      {/* frame ticks — contact-sheet cue */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
        <p className="type-meta text-bone/80">
          {String((index % hero.length) + 1).padStart(2, '0')} / {String(hero.length).padStart(2, '0')}
        </p>
        <p className="type-meta text-bone/80">Seed deck · live plates</p>
      </div>
      <div className="absolute top-10 left-3 right-3 z-20 flex gap-1">
        {hero.map((h, i) => (
          <div key={h.uid} className="h-0.5 flex-1 bg-bone/20 overflow-hidden">
            <motion.div
              className="h-full bg-hibiscus"
              initial={{ width: i < index % hero.length ? '100%' : '0%' }}
              animate={{
                width: i === index % hero.length && !reduce ? '100%' : i < index % hero.length ? '100%' : '0%',
              }}
              transition={{
                duration: i === index % hero.length ? 2.8 : 0.2,
                ease: 'linear',
              }}
            />
          </div>
        ))}
      </div>

      {/* nameplate */}
      <div className="absolute inset-x-4 bottom-16 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.uid}
            initial={reduce ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="nameplate text-3xl sm:text-4xl max-w-max">
              {current?.name}
              {current?.age ? `, ${current.age}` : ''}
            </h2>
            <p className="type-meta mt-2">
              {current?.location?.city}
              {current?.location?.distanceLabel ? ` · ${current.location.distanceLabel}` : ''}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* dual drifting rails */}
      {!reduce && (
        <div className="absolute bottom-0 inset-x-0 z-20 py-2 space-y-1 overflow-hidden">
          <div className="flex gap-1 w-max animate-marquee-left">
            {[...railTop, ...railTop].map((p, i) => (
              <img
                key={`t-${p.uid}-${i}`}
                src={p.photos?.[0]}
                alt=""
                className="h-12 w-9 object-cover object-top border border-line/80 shrink-0 grayscale hover:grayscale-0 transition"
                draggable={false}
              />
            ))}
          </div>
          <div className="flex gap-1 w-max animate-marquee-right">
            {[...railBottom, ...railBottom].map((p, i) => (
              <img
                key={`b-${p.uid}-${i}`}
                src={p.photos?.[0]}
                alt=""
                className="h-12 w-9 object-cover object-top border border-line/80 shrink-0 grayscale hover:grayscale-0 transition"
                draggable={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
