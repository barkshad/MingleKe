import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Sparkles, Filter, Compass, Flag } from 'lucide-react';
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
import { Avatar } from '../components/Avatar';
import { cn, PLACEHOLDER_AVATAR } from '../lib/utils';
import { fetchDiscoveryProfiles, getSwipedUids, type MatchUser } from '../store';
import { filterSeeds, type SeedProfile } from '../lib/seedProfiles';
import { useToast } from '../components/Toast';
import { FreeCountdown } from '../components/FreeCountdown';
import { isFreeWindow } from '../lib/promo';
import { useNavigate } from 'react-router-dom';

const isSeedUid = (uid: string) => uid.startsWith('seed-');

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
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-40, -140], [0, 1]);

  const loadProfiles = useCallback(async () => {
    if (!user || !currentUserProfile) return;
    setLoading(true);
    setError('');
    try {
      const localPassed = JSON.parse(localStorage.getItem(`mingleke-swiped-${user.uid}`) || '[]') as string[];
      const swiped = await getSwipedUids(user.uid);
      const exclude = [...swiped.liked, ...swiped.passed, ...localPassed];
      const filters = {
        interestedIn: currentUserProfile.interestedIn || ('everyone' as const),
        minAge,
        maxAge,
      };

      let list: MatchUser[] = [];
      try {
        list = await fetchDiscoveryProfiles(user.uid, filters, exclude);
      } catch (err) {
        console.error(err);
      }

      // Always backfill with realistic demo members when the live pool is thin
      const liveUids = new Set(list.map((p) => p.uid));
      const seeds = filterSeeds(filters, [...exclude, ...liveUids]).filter((s) => {
        if (filters.interestedIn === 'men') return s.gender === 'male';
        if (filters.interestedIn === 'women') return s.gender === 'female';
        return true;
      });

      // Interleave: live people first, then demo members so the deck stays full
      const merged = [...list, ...seeds];
      setProfiles(merged);
      setCurrentIndex(0);
      setActivePhotoIndex(0);
    } catch (err: any) {
      console.error(err);
      setError('Could not load people right now.');
      // Offline / API failure: still show demo deck so the app is usable
      const seeds = filterSeeds(
        {
          interestedIn: currentUserProfile.interestedIn || 'everyone',
          minAge,
          maxAge,
        },
        []
      );
      setProfiles(seeds);
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
    const reason = window.prompt('Why are you reporting this person? (spam, inappropriate, harassment, other)');
    if (!reason?.trim()) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportedId: profileId,
        reason: reason.trim().slice(0, 500),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast('Report sent. Thanks for looking out for the community.', 'success');
      setCurrentIndex((i) => i + 1);
    } catch (err) {
      console.error(err);
      toast('Could not send report. Try again.', 'error');
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
        localStorage.setItem(key, JSON.stringify([...prev, uid]));
      } catch {
        // ignore quota
      }
    };

    try {
      remember(swipedUser.uid);

      if (isSeedUid(swipedUser.uid)) {
        // Demo members: local like/pass, optional playful match
        if (direction === 'right' && Math.random() < 0.45) {
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
              {
                users: [user.uid, swipedUser.uid],
                matchedAt: serverTimestamp(),
              },
              { merge: true }
            );
            setMatchFound(swipedUser);
            setMatchId(newMatchId);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast('Could not save that swipe.', 'error');
    } finally {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        x.set(0);
        setSwiping(false);
      }, 180);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-line border-t-rose animate-spin" />
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose" size={22} />
        </div>
        <p className="text-mist font-medium">Finding people nearby…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 overflow-hidden relative z-10">
      <header className="flex items-center justify-between px-1 mb-3">
        <h1 className="text-2xl font-bold text-cream flex items-center gap-2">
          <Heart className="fill-rose text-rose" size={22} />
          MingleKE
        </h1>
        <button
          onClick={() => setShowFilters(true)}
          className="p-3 glass-panel rounded-full text-mist hover:text-cream transition-colors min-w-[44px] min-h-[44px]"
          aria-label="Filters"
        >
          <Filter size={18} />
        </button>
      </header>

      {isFreeWindow() && (
        <div className="mb-3">
          <FreeCountdown compact />
        </div>
      )}

      <div className="flex-1 relative">
        <AnimatePresence>
          {currentProfile ? (
            <motion.div
              key={currentProfile.uid}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (swiping) return;
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
                else x.set(0);
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-full h-full card-container relative select-none">
                <img
                  src={photos[activePhotoIndex] || PLACEHOLDER_AVATAR}
                  alt={currentProfile.name}
                  draggable={false}
                  className="w-full h-full absolute inset-0 object-cover object-top select-none pointer-events-none bg-line"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                  }}
                />

                <div className="absolute inset-0 flex">
                  <button
                    type="button"
                    aria-label="Previous photo"
                    className="w-1/2 h-[70%] z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoClick('prev');
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Next photo"
                    className="w-1/2 h-[70%] z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoClick('next');
                    }}
                  />
                </div>

                {photos.length > 1 && (
                  <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-200',
                          idx === activePhotoIndex ? 'bg-cream' : 'bg-white/30'
                        )}
                      />
                    ))}
                  </div>
                )}

                <motion.div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-12 left-8 pointer-events-none z-30 stamp-like text-3xl"
                >
                  Like
                </motion.div>
                <motion.div
                  style={{ opacity: nopeOpacity }}
                  className="absolute top-12 right-8 pointer-events-none z-30 stamp-nope text-3xl"
                >
                  Nope
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-5 text-cream space-y-1.5 z-30">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-3xl font-bold drop-shadow-sm">
                        {currentProfile.name}
                        {currentProfile.age ? `, ${currentProfile.age}` : ''}
                      </h2>
                      {(currentProfile.location?.distanceLabel || currentProfile.location?.city) && (
                        <p className="text-white/85 text-sm mt-0.5 flex items-center gap-1">
                          {currentProfile.location?.city}
                          {currentProfile.location?.distanceLabel ? ` · ${currentProfile.location.distanceLabel}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReport(currentProfile.uid);
                      }}
                      className="mb-1 p-2.5 bg-black/40 rounded-full text-white/70 hover:text-rose transition-colors min-w-[40px] min-h-[40px]"
                      aria-label="Report user"
                    >
                      <Flag size={16} />
                    </button>
                  </div>
                  {currentProfile.bio && (
                    <p className="text-white/90 text-sm line-clamp-2 pt-1 leading-relaxed">{currentProfile.bio}</p>
                  )}
                  {currentProfile.interests && currentProfile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentProfile.interests.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/12 border border-white/20 text-white/90 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-5">
              <div className="w-28 h-28 glass-panel rounded-full flex items-center justify-center">
                <Compass size={52} className="text-mist" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">That's everyone for now</h3>
                <p className="text-mist">
                  {error || 'Widen your age range or check back soon for new members.'}
                </p>
              </div>
              <button onClick={loadProfiles} className="btn-primary">
                Refresh search
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-36 flex items-start justify-center gap-5 pt-2">
        <button
          onClick={() => handleSwipe('left')}
          disabled={swiping || !currentProfile}
          className="w-14 h-14 glass-panel rounded-full flex items-center justify-center text-mist active:scale-90 transition-all disabled:opacity-40 hover:text-rose min-w-[48px] min-h-[48px]"
          aria-label="Pass"
        >
          <X size={26} strokeWidth={3} />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          disabled={swiping || !currentProfile}
          className="w-18 h-18 min-w-[64px] min-h-[64px] rounded-full bg-rose text-white flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-rose/30 disabled:opacity-40 hover:bg-rose-deep"
          aria-label="Like"
        >
          <Heart size={30} fill="currentColor" strokeWidth={0} />
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="w-14 h-14 glass-panel rounded-full flex items-center justify-center text-amber active:scale-90 transition-all min-w-[48px] min-h-[48px]"
          aria-label="Age filters"
        >
          <Sparkles size={24} fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      <AnimatePresence>
        {matchFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
            <div className="absolute top-10 -left-16 w-64 h-64 bg-rose/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-10 -right-16 w-64 h-64 bg-[#ff8a5b]/15 rounded-full blur-[80px]" />

            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              className="text-center space-y-8 relative z-10 w-full max-w-sm"
            >
              <div className="space-y-2">
                <span className="text-mist font-bold uppercase tracking-[0.25em] text-xs">Mutual like</span>
                <h2 className="text-6xl font-bold">It's a match</h2>
              </div>

              <div className="flex items-center justify-center -space-x-6">
                <Avatar
                  src={currentUserProfile?.photos?.[0]}
                  alt="You"
                  className="w-32 h-32 rounded-full border-4 border-cream rotate-[-10deg]"
                />
                <Avatar
                  src={matchFound.photos?.[0]}
                  alt={matchFound.name}
                  className="w-32 h-32 rounded-full border-4 border-cream rotate-[10deg] z-10"
                />
              </div>

              <p className="text-xl font-medium text-cream">You and {matchFound.name} liked each other.</p>

              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={() => {
                    const id = matchId;
                    setMatchFound(null);
                    if (id && id.startsWith('demo-')) {
                      toast('Demo match — live chat unlocks with real members.', 'info');
                      return;
                    }
                    if (id) navigate(`/chat/${id}`);
                    else navigate('/matches');
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

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 space-y-5 border border-line"
            >
              <div>
                <h3 className="text-xl font-bold">Discovery filters</h3>
                <p className="text-mist text-sm">Tune who shows up in your stack.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-mist uppercase tracking-wider">
                  Age: {minAge} – {maxAge}
                </label>
                <div className="flex gap-3">
                  <input
                    type="range"
                    min={18}
                    max={60}
                    value={minAge}
                    onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                    className="flex-1 accent-rose"
                  />
                  <input
                    type="range"
                    min={19}
                    max={70}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                    className="flex-1 accent-rose"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMinAge(18);
                    setMaxAge(45);
                  }}
                  className="btn-secondary flex-1"
                >
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
