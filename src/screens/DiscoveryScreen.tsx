import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Sparkles, Filter, Flag, ArrowLeft } from 'lucide-react';
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
import { useToast } from '../components/Toast';
import { FreeCountdown } from '../components/FreeCountdown';
import { isFreeWindow } from '../lib/promo';
import { useNavigate } from 'react-router-dom';

const isSeedUid = (uid: string) => uid.startsWith('seed-') || uid.startsWith('wa-');

export default function DiscoveryScreen() {
  const [profiles, setProfiles] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [matchFound, setMatchFound] = useState<MatchUser | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const { user, profile: currentUserProfile } = useAuth();
  const toast = useToast((s) => s.show);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-40, -140], [0, 1]);

  const loadProfiles = useCallback(async () => {
    if (!user || !currentUserProfile) return;
    setLoading(true);
    setError('');
    const filters = {
      interestedIn: currentUserProfile.interestedIn || ('everyone' as const),
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

      const liveUids = new Set(list.map((p) => p.uid));
      const seeds = filterSeeds(filters, [...exclude, ...liveUids]);
      setProfiles([...list, ...seeds]);
      setCurrentIndex(0);
      setActivePhotoIndex(0);
    } catch (err: any) {
      console.error(err);
      setError('Could not load the deck.');
      setProfiles(filterSeeds(filters, []));
    } finally {
      setLoading(false);
    }
  }, [user, currentUserProfile, minAge, maxAge]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [currentIndex]);

  const currentProfile = profiles[currentIndex];
  const photos = useMemo(
    () => (currentProfile?.photos?.length ? currentProfile.photos : [PLACEHOLDER_AVATAR]),
    [currentProfile]
  );

  const handlePhotoClick = (direction: 'next' | 'prev') => {
    const count = photos.length;
    if (count <= 1) return;
    setActivePhotoIndex((prev) =>
      direction === 'next' ? (prev + 1) % count : (prev - 1 + count) % count
    );
  };

  const handleReport = async (profileId: string) => {
    if (!user) return;
    const reason = window.prompt('What happened? (spam, fake, harassment, other)');
    if (!reason?.trim()) return;
    try {
      if (!isSeedUid(profileId)) {
        await addDoc(collection(db, 'reports'), {
          reporterId: user.uid,
          reportedId: profileId,
          reason: reason.trim().slice(0, 500),
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }
      toast('Report filed. We review every one.', 'success');
      setCurrentIndex((i) => i + 1);
    } catch {
      toast('Could not file that report.', 'error');
    }
  };

  const handleSwipe = async (direction: 'right' | 'left') => {
    if (swiping || !user || currentIndex >= profiles.length) return;
    const swipedUser = profiles[currentIndex];
    setSwiping(true);
    x.set(direction === 'right' ? 320 : -320);

    const remember = (uid: string) => {
      try {
        const key = `mingleke-swiped-${user.uid}`;
        const prev = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        localStorage.setItem(key, JSON.stringify([...new Set([...prev, uid])]));
      } catch {
        // ignore
      }
    };

    try {
      remember(swipedUser.uid);

      if (isSeedUid(swipedUser.uid)) {
        if (direction === 'right' && Math.random() < 0.4) {
          setMatchFound(swipedUser);
          setMatchId(`demo-${swipedUser.uid}`);
        }
      } else {
        await addDoc(collection(db, 'likes'), {
          senderId: user.uid,
          receiverId: swipedUser.uid,
          action: direction === 'right' ? 'like' : 'pass',
          createdAt: serverTimestamp(),
        });

        if (direction === 'right') {
          const mutual = await getDocs(
            query(
              collection(db, 'likes'),
              where('senderId', '==', swipedUser.uid),
              where('receiverId', '==', user.uid),
              where('action', '==', 'like')
            )
          );
          if (!mutual.empty) {
            const newMatchId = [user.uid, swipedUser.uid].sort().join('_');
            await setDoc(
              doc(db, 'matches', newMatchId),
              { users: [user.uid, swipedUser.uid], matchedAt: serverTimestamp() },
              { merge: true }
            );
            setMatchFound(swipedUser);
            setMatchId(newMatchId);
          }
        }
      }
    } catch {
      toast('Swipe not saved.', 'error');
    } finally {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        x.set(0);
        setSwiping(false);
      }, 160);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <div className="h-10 w-10 border border-line border-t-hibiscus animate-spin" />
        <p className="type-meta">Loading deck</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 pb-14 min-h-0">
      <header className="flex items-center justify-between page-pad py-3 border-b border-line shrink-0">
        <div className="min-w-0">
          <h1 className="fluid-display-sm leading-none">Deck</h1>
          <p className="type-meta mt-1 truncate">
            {Math.max(profiles.length - currentIndex, 0)} left · {minAge}–{maxAge}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="type-meta border border-line px-3 py-2 hover:border-bone-dim min-h-[44px] shrink-0"
          aria-label="Filters"
        >
          <Filter size={14} className="inline mr-1" />
          Filter
        </button>
      </header>

      {isFreeWindow() && (
        <div className="page-pad py-2 border-b border-line shrink-0">
          <FreeCountdown compact />
        </div>
      )}

      <div className="flex-1 relative min-h-0 p-2 sm:p-3">
        <AnimatePresence>
          {currentProfile ? (
            <motion.div
              key={currentProfile.uid}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (swiping) return;
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
                else x.set(0);
              }}
              className="absolute inset-2 sm:inset-3 cursor-grab active:cursor-grabbing"
            >
              <div className="w-full h-full plate relative select-none">
                <img
                  src={photos[activePhotoIndex] || PLACEHOLDER_AVATAR}
                  alt={currentProfile.name}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover object-top bg-ink-soft"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                  }}
                />

                <div className="absolute inset-0 flex">
                  <button type="button" aria-label="Previous photo" className="w-1/2 h-[72%]" onClick={(e) => { e.stopPropagation(); handlePhotoClick('prev'); }} />
                  <button type="button" aria-label="Next photo" className="w-1/2 h-[72%]" onClick={(e) => { e.stopPropagation(); handlePhotoClick('next'); }} />
                </div>

                {photos.length > 1 && (
                  <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {photos.map((_, idx) => (
                      <div key={idx} className={cn('h-0.5 flex-1', idx === activePhotoIndex ? 'bg-bone' : 'bg-bone/25')} />
                    ))}
                  </div>
                )}

                <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-4 z-30 stamp-like text-lg">
                  Like
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-4 z-30 stamp-nope text-lg">
                  Pass
                </motion.div>

                <div
                  className="absolute inset-x-0 bottom-0 h-2/5 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, #14110E 5%, transparent)' }}
                />

                {/* nameplate signature */}
                <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 z-30">
                  <div className="flex items-end justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <h2 className="nameplate text-lg sm:text-2xl md:text-[28px] max-w-full truncate">
                        {currentProfile.name}
                        {currentProfile.age ? `, ${currentProfile.age}` : ''}
                      </h2>
                      <p className="type-meta mt-1 truncate">
                        {currentProfile.location?.city || 'Nearby'}
                        {currentProfile.location?.distanceLabel ? ` · ${currentProfile.location.distanceLabel}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReport(currentProfile.uid); }}
                      className="type-meta border border-line bg-ink/80 px-2 py-2 hover:text-hibiscus hover:border-hibiscus min-h-[40px] shrink-0"
                      aria-label="Report"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                  {currentProfile.bio && (
                    <p className="text-sm text-bone leading-snug line-clamp-2 mb-1">{currentProfile.bio}</p>
                  )}
                  {currentProfile.interests?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.interests.slice(0, 3).map((tag) => (
                        <span key={tag} className="type-meta border border-line bg-ink/85 px-1.5 py-0.5 truncate max-w-[7rem]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-2 sm:inset-3 flex flex-col justify-center page-pad gap-4">
              <p className="type-meta">Deck empty</p>
              <h3 className="type-display text-4xl leading-none">
                {error ? 'Signal lost' : 'That is everyone'}
              </h3>
              <p className="text-bone-dim text-sm max-w-xs">
                {error || 'Widen the age range or come back later for new plates.'}
              </p>
              <button onClick={loadProfiles} className="btn-primary max-w-xs">
                Reload deck
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-14 sm:bottom-16 inset-x-0 px-3 sm:px-4 flex items-center justify-between gap-3 z-40">
        <button
          onClick={() => handleSwipe('left')}
          disabled={swiping || !currentProfile}
          className="type-display h-12 sm:h-14 px-4 sm:px-6 border border-line bg-ink text-bone hover:border-hibiscus hover:text-hibiscus disabled:opacity-40 min-w-[72px] sm:min-w-[88px]"
          aria-label="Pass"
        >
          Pass
        </button>
        <button
          onClick={() => handleSwipe('right')}
          disabled={swiping || !currentProfile}
          className="btn-primary h-12 sm:h-14 min-w-[100px] sm:min-w-[112px] !w-auto px-5 sm:px-6"
          aria-label="Like"
        >
          Like
        </button>
      </div>

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
              className="absolute inset-0 w-full h-full object-cover object-top opacity-45"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #14110E 30%, transparent)' }} />
            <motion.div
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              className="relative z-10 p-6 space-y-4"
            >
              <p className="type-meta">Mutual</p>
              <h2 className="type-display text-4xl leading-none">
                You matched
                <br />
                <span className="text-hibiscus break-words">{matchFound.name}</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <button
                  onClick={() => {
                    const id = matchId;
                    setMatchFound(null);
                    if (id && id.startsWith('demo-')) {
                      toast('Demo match. Live chat unlocks with real members.', 'info');
                      return;
                    }
                    navigate(id ? `/chat/${id}` : '/matches');
                  }}
                  className="btn-primary"
                >
                  Send a message
                </button>
                <button onClick={() => setMatchFound(null)} className="btn-secondary !w-auto px-4">
                  Keep swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-ink/90 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="panel w-full max-w-md p-5 space-y-5">
              <div className="flex items-start justify-between">
                <h3 className="type-display text-2xl">Filter</h3>
                <button onClick={() => setShowFilters(false)} className="type-meta" aria-label="Close">
                  <ArrowLeft size={16} className="rotate-45" />
                </button>
              </div>
              <div className="space-y-2">
                <label className="type-meta">Age {minAge}–{maxAge}</label>
                <input type="range" min={18} max={60} value={minAge} onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))} className="w-full accent-hibiscus" />
                <input type="range" min={19} max={70} value={maxAge} onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))} className="w-full accent-hibiscus" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMinAge(18); setMaxAge(45); }} className="btn-secondary !w-auto flex-1">
                  Reset
                </button>
                <button onClick={() => { setShowFilters(false); loadProfiles(); }} className="btn-primary flex-1">
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
