import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Star, Filter, Flag } from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import { cn, PLACEHOLDER_AVATAR } from '../lib/utils';
import { fetchDiscoveryProfiles, getSwipedUids, type MatchUser } from '../store';
import { filterSeeds } from '../lib/seedProfiles';
import { ensureDemoThread, rememberLocalSwipe, demoMatchId } from '../lib/demoChat';
import { withTimeout } from '../lib/network';
import { isFreeWindow } from '../lib/promo';
import { useToast } from '../components/Toast';
import { FreeCountdown } from '../components/FreeCountdown';
import { useNavigate } from 'react-router-dom';

const isMemberUid = (uid: string) =>
  uid.startsWith('mem-') || uid.startsWith('seed-') || uid.startsWith('wa-');

export default function DiscoveryScreen() {
  const [profiles, setProfiles] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [matchFound, setMatchFound] = useState<MatchUser | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const { user, profile: me } = useAuth();
  const toast = useToast((s) => s.show);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-30, -130], [0, 1]);

  const loadProfiles = useCallback(async () => {
    if (!user || !me) return;
    setLoading(true);
    setError('');
    const filters = {
      interestedIn: me.interestedIn || ('everyone' as const),
      minAge,
      maxAge,
    };
    try {
      const localPassed = JSON.parse(localStorage.getItem(`mingleke-swiped-${user.uid}`) || '[]') as string[];
      const swiped = await getSwipedUids(user.uid);
      const exclude = [...swiped.liked, ...swiped.passed, ...localPassed];

      let list: MatchUser[] = [];
      try {
        list = await fetchDiscoveryProfiles(user.uid, filters, exclude);
      } catch (err) {
        console.error(err);
      }

      const live = new Set(list.map((p) => p.uid));
      const seeds = filterSeeds(filters, [...exclude, ...live]);
      setProfiles([...list, ...seeds]);
      setCurrentIndex(0);
      setPhotoIdx(0);
    } catch (err: any) {
      console.error(err);
      setError('Could not load people.');
      setProfiles(filterSeeds(filters, []));
    } finally {
      setLoading(false);
    }
  }, [user, me, minAge, maxAge]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    setPhotoIdx(0);
  }, [currentIndex]);

  const card = profiles[currentIndex];
  const photos = useMemo(
    () => (card?.photos?.length ? card.photos : [PLACEHOLDER_AVATAR]),
    [card]
  );
  const photo = photos[Math.min(photoIdx, photos.length - 1)];

  const handleSwipe = async (dir: 'right' | 'left' | 'super') => {
    if (swiping || !user || !card) return;
    setSwiping(true);
    x.set(dir === 'left' ? -360 : 360);

    const remember = (uid: string) => {
      try {
        const key = `mingleke-swiped-${user.uid}`;
        const prev = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        localStorage.setItem(key, JSON.stringify([...new Set([...prev, uid])]));
      } catch {
        /* ignore */
      }
    };

    try {
      remember(card.uid);

      if (isMemberUid(card.uid)) {
        if (dir !== 'left') {
          ensureDemoThread(card.uid, user.uid);
          setMatchFound(card);
          setMatchId(demoMatchId(card.uid, user.uid));
        }
      } else {
        await withTimeout(
          addDoc(collection(db, 'likes'), {
            senderId: user.uid,
            receiverId: card.uid,
            action: dir === 'left' ? 'pass' : 'like',
            createdAt: serverTimestamp(),
          }),
          5000,
          'Swipe'
        );

        if (dir !== 'left') {
          const mutual = await withTimeout(
            getDocs(
              query(
                collection(db, 'likes'),
                where('senderId', '==', card.uid),
                where('receiverId', '==', user.uid),
                where('action', '==', 'like')
              )
            ),
            4000,
            'Match'
          );
          if (!mutual.empty) {
            const id = [user.uid, card.uid].sort().join('_');
            await setDoc(
              doc(db, 'matches', id),
              { users: [user.uid, card.uid], matchedAt: serverTimestamp() },
              { merge: true }
            );
            setMatchFound(card);
            setMatchId(id);
          }
        }
      }
    } catch {
      if (isMemberUid(card.uid) && dir !== 'left') {
        ensureDemoThread(card.uid, user.uid);
        setMatchFound(card);
        setMatchId(demoMatchId(card.uid, user.uid));
      }
    } finally {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        x.set(0);
        setSwiping(false);
      }, 140);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-ink">
        <div className="h-10 w-10 border border-line border-t-hibiscus animate-spin" />
        <p className="type-meta">Loading people…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 bg-ink min-h-0 pb-14">
      {/* Tinder top bar */}
      <header className="flex items-center justify-between page-pad py-2 shrink-0 border-b border-line/60">
        <h1 className="type-display text-xl">MingleKE</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 text-bone-dim hover:text-bone min-h-[44px] min-w-[44px]"
            aria-label="Filters"
          >
            <Filter size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {isFreeWindow() && (
        <div className="page-pad py-1.5 border-b border-line/60 shrink-0">
          <FreeCountdown compact />
        </div>
      )}

      {/* Full-bleed card stack */}
      <div className="flex-1 relative min-h-0 p-2 sm:p-3">
        <AnimatePresence>
          {card ? (
            <motion.div
              key={card.uid}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.75}
              onDragEnd={(_, info) => {
                if (swiping) return;
                if (info.offset.x > 110 || info.velocity.x > 500) handleSwipe('right');
                else if (info.offset.x < -110 || info.velocity.x < -500) handleSwipe('left');
                else x.set(0);
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-full h-full rounded-2xl overflow-hidden relative bg-line select-none shadow-xl shadow-black/40">
                {/* PHOTO — full card */}
                <img
                  src={photo || PLACEHOLDER_AVATAR}
                  alt={card.name}
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                  }}
                />

                {/* tap zones for photos */}
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-0 top-0 bottom-24 w-1/3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIdx((i) => Math.max(0, i - 1));
                  }}
                />
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-0 top-0 bottom-24 w-1/3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIdx((i) => Math.min(photos.length - 1, i + 1));
                  }}
                />

                {/* photo ticks */}
                {photos.length > 1 && (
                  <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full backdrop-blur-sm',
                          i === photoIdx ? 'bg-white' : 'bg-white/35'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* swipe stamps */}
                <motion.div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-8 left-5 z-30 border-4 border-sage text-sage font-display font-bold uppercase tracking-widest px-3 py-1.5 text-2xl -rotate-12 bg-black/30"
                >
                  Like
                </motion.div>
                <motion.div
                  style={{ opacity: nopeOpacity }}
                  className="absolute top-8 right-5 z-30 border-4 border-hibiscus text-hibiscus font-display font-bold uppercase tracking-widest px-3 py-1.5 text-2xl rotate-12 bg-black/30"
                >
                  Nope
                </motion.div>

                {/* Tinder-style bottom info on the photo */}
                <div
                  className="absolute inset-x-0 bottom-0 z-20 p-4 pt-16"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                  }}
                >
                  <div className="flex items-end justify-between gap-2">
                    <h2 className="text-white text-3xl sm:text-4xl font-bold leading-none drop-shadow">
                      {card.name}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const reason = window.prompt('Report reason?');
                        if (reason?.trim()) {
                          toast('Report sent. Thanks.', 'success');
                          setCurrentIndex((i) => i + 1);
                        }
                      }}
                      className="p-2.5 rounded-full bg-black/40 text-white/70 hover:text-hibiscus min-h-[40px]"
                      aria-label="Report"
                    >
                      <Flag size={16} />
                    </button>
                  </div>
                  <p className="text-white/85 text-sm mt-1">
                    {card.location?.city || 'Nearby'}
                    {card.location?.distanceLabel ? ` · ${card.location.distanceLabel}` : ''}
                  </p>
                  {card.bio && (
                    <p className="text-white/90 text-sm mt-1.5 line-clamp-2 leading-snug">{card.bio}</p>
                  )}
                  {card.interests?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.interests.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[11px] text-white/90 bg-white/15 border border-white/20 px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 page-pad text-center">
              <p className="type-meta">End of stack</p>
              <h3 className="type-display text-4xl">{error ? 'No signal' : 'That’s everyone'}</h3>
              <p className="text-bone-dim text-sm max-w-xs">
                {error || 'Widen the age range or come back later.'}
              </p>
              <button onClick={loadProfiles} className="btn-primary max-w-[200px]">
                Reload
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Tinder action row floating on the card bottom */}
        {card && (
          <div className="absolute left-0 right-0 bottom-2 sm:bottom-3 z-40 flex items-center justify-center gap-5 sm:gap-7 pointer-events-none">
            <button
              onClick={() => handleSwipe('left')}
              disabled={swiping}
              className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-hibiscus shadow-lg flex items-center justify-center active:scale-90 transition disabled:opacity-40"
              aria-label="Nope"
            >
              <X size={30} strokeWidth={3} />
            </button>
            <button
              onClick={() => handleSwipe('super')}
              disabled={swiping}
              className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-sky-400 shadow-lg flex items-center justify-center active:scale-90 transition disabled:opacity-40"
              aria-label="Super like"
            >
              <Star size={20} fill="currentColor" strokeWidth={0} />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              disabled={swiping}
              className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-sage shadow-lg flex items-center justify-center active:scale-90 transition disabled:opacity-40"
              aria-label="Like"
            >
              <Heart size={30} fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        )}
      </div>

      {/* Match modal */}
      <AnimatePresence>
        {matchFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink flex flex-col justify-end"
          >
            <img
              src={matchFound.photos?.[0] || PLACEHOLDER_AVATAR}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #14110E 35%, transparent)' }}
            />
            <motion.div initial={{ y: 24 }} animate={{ y: 0 }} className="relative z-10 p-6 space-y-3">
              <p className="type-meta tracking-[0.3em]">Mutual</p>
              <h2 className="type-display text-5xl sm:text-6xl leading-[0.9]">
                You matched
                <br />
                <span className="text-hibiscus uppercase">{matchFound.name}</span>
              </h2>
              <div className="flex flex-col gap-2 max-w-md pt-3">
                <button
                  onClick={() => {
                    const id = matchId;
                    setMatchFound(null);
                    navigate(id ? `/chat/${id}` : '/messages');
                  }}
                  className="btn-primary"
                >
                  Send a message
                </button>
                <button onClick={() => setMatchFound(null)} className="btn-secondary">
                  Keep swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/80 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="panel w-full max-w-md p-5 space-y-5">
              <h3 className="type-display text-2xl">Filters</h3>
              <div className="space-y-2">
                <label className="type-meta">Age {minAge}–{maxAge}</label>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                  className="w-full accent-hibiscus"
                />
                <input
                  type="range"
                  min={19}
                  max={70}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                  className="w-full accent-hibiscus"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMinAge(18) || setMaxAge(45)} className="btn-secondary flex-1">
                  Reset
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    loadProfiles();
                  }}
                  className="btn-primary flex-1"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  );
}
