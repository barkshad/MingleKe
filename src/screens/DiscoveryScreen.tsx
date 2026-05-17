import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Info, MapPin, Sparkles, Filter } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';

interface Profile {
  uid: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location?: { city: string };
  gender: string;
}

export default function DiscoveryScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchFound, setMatchFound] = useState<Profile | null>(null);
  const { user, profile: currentUserProfile } = useAuth();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  useEffect(() => {
    fetchProfiles();
  }, [currentUserProfile]);

  const fetchProfiles = async () => {
    if (!user || !currentUserProfile) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('onboarded', '==', true),
        // Simple filter for MVP: exclude self
        // In real app, we'd filter by distance and gender preference
      );
      const querySnapshot = await getDocs(q);
      const results: Profile[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          results.push({ uid: doc.id, ...doc.data() } as Profile);
        }
      });
      // Filter by preference client-side for simplicity in MVP
      const filtered = results.filter(p => {
        if (currentUserProfile.interestedIn === 'everyone') return true;
        if (currentUserProfile.interestedIn === 'men' && p.gender === 'male') return true;
        if (currentUserProfile.interestedIn === 'women' && p.gender === 'female') return true;
        return false;
      });
      setProfiles(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'right' | 'left') => {
    if (currentIndex >= profiles.length) return;
    const swipedUser = profiles[currentIndex];

    if (direction === 'right') {
      // Create Like
      await addDoc(collection(db, 'likes'), {
        senderId: user?.uid,
        receiverId: swipedUser.uid,
        createdAt: serverTimestamp(),
      });

      // Check for mutual like
      const q = query(
        collection(db, 'likes'),
        where('senderId', '==', swipedUser.uid),
        where('receiverId', '==', user?.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // MATCH!
        const matchId = [user?.uid, swipedUser.uid].sort().join('_');
        await setDoc(doc(db, 'matches', matchId), {
          users: [user?.uid, swipedUser.uid],
          matchedAt: serverTimestamp(),
        });
        setMatchFound(swipedUser);
      }
    }

    setCurrentIndex(currentIndex + 1);
    x.set(0);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary-main/20 border-t-primary-main animate-spin" />
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-main animate-pulse" />
        </div>
        <p className="text-gray-400 font-medium">Finding people nearby...</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-2 mb-4">
        <h1 className="text-2xl font-black text-primary-main flex items-center gap-2">
          <Heart className="fill-primary-main" size={24} />
          MingleKE
        </h1>
        <button className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-700 transition-colors">
          <Filter size={20} />
        </button>
      </header>

      {/* Cards Container */}
      <div className="flex-1 relative perspective-1000">
        <AnimatePresence>
          {currentProfile ? (
            <motion.div
              key={currentProfile.uid}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
                else x.set(0);
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-full h-full card-container relative group">
                <img 
                  src={currentProfile.photos[0] || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'} 
                  className="w-full h-full object-cover select-none pointer-events-none"
                  alt={currentProfile.name} 
                />
                
                {/* Overlays */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 border-4 border-teal-400 rounded-lg py-2 px-4 rotate-[-20deg] pointer-events-none">
                  <span className="text-teal-400 text-4xl font-black uppercase tracking-widest">Like</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 border-4 border-red-500 rounded-lg py-2 px-4 rotate-[20deg] pointer-events-none">
                  <span className="text-red-500 text-4xl font-black uppercase tracking-widest">Nope</span>
                </motion.div>

                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-1">
                  <div className="flex items-end gap-2">
                    <h2 className="text-3xl font-black">{currentProfile.name}, {currentProfile.age}</h2>
                    <div className="mb-2 bg-primary-main/20 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                       <Sparkles size={12} className="text-white fill-white" />
                       <span className="text-[10px] font-bold uppercase tracking-wide">Popular</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <MapPin size={14} />
                    <span>{currentProfile.location?.city || 'Nairobi'} • 5km away</span>
                  </div>
                  <p className="text-white/90 text-sm line-clamp-2 pt-2 leading-relaxed">
                    {currentProfile.bio}
                  </p>
                </div>
                
                <button className="absolute bottom-24 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30">
                  <Info size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                 <Compass size={64} className="text-gray-300 animate-spin-slow" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">That's everyone for now!</h3>
                <p className="text-gray-500">Try expanding your search radius or update your preferences to find more people.</p>
              </div>
              <button 
                onClick={fetchProfiles}
                className="btn-secondary w-full"
              >
                Refresh Search
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="h-28 flex items-center justify-center gap-6">
        <button 
          onClick={() => { x.set(-300); setTimeout(() => handleSwipe('left'), 200); }}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 border border-slate-100 active:scale-90 transition-transform"
        >
          <X size={32} strokeWidth={3} />
        </button>
        <button 
           onClick={() => { x.set(300); setTimeout(() => handleSwipe('right'), 200); }}
           className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center text-accent-teal border border-slate-100 active:scale-95 transition-transform"
        >
          <Heart size={44} fill="currentColor" strokeWidth={0} />
        </button>
        <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-light border border-slate-100 active:scale-90 transition-transform">
          <Sparkles size={32} fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {matchFound && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 gradient-primary flex flex-col items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center space-y-8"
            >
              <h2 className="text-6xl font-black italic text-white drop-shadow-xl">It's a Match!</h2>
              
              <div className="flex items-center justify-center -space-x-8">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden rotate-[-12deg]">
                  <img src={currentUserProfile?.photos[0]} alt="You" className="w-full h-full object-cover" />
                </div>
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden rotate-[12deg] z-10">
                  <img src={matchFound.photos[0]} alt="Match" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="text-white space-y-2">
                <p className="text-xl font-medium">You and {matchFound.name} liked each other.</p>
              </div>

              <div className="w-full space-y-4 pt-4">
                <button 
                  onClick={() => setMatchFound(null)}
                  className="w-full bg-white text-primary-main font-black py-4 rounded-full text-lg shadow-xl"
                >
                  Send a Message
                </button>
                <button 
                  onClick={() => setMatchFound(null)}
                  className="w-full bg-white/20 border border-white text-white font-bold py-4 rounded-full text-lg"
                >
                  Keep Swiping
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
