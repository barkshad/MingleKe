import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useMatchStore } from '../store';
import { Avatar } from '../components/Avatar';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { matches, loading, error, subscribeToMatches, reset } = useMatchStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const isMessagesView = location.pathname === '/messages';

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMatches(user.uid);
    return () => {
      unsubscribe();
    };
  }, [user, subscribeToMatches]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const filtered = matches.filter((m) =>
    (m.otherUser.name || '').toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-cream">
      <header className="p-6 pb-3">
        <h1 className="text-4xl font-bold mb-5">{isMessagesView ? 'Chats' : 'Matches'}</h1>
        {matches.length > 0 && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search matches"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-rose" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <p className="text-rose font-medium">{error}</p>
            <button
              onClick={() => user && subscribeToMatches(user.uid)}
              className="btn-secondary max-w-[200px]"
            >
              Try again
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3 mt-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-mist mb-3 px-1">Your connections</h2>
            {filtered.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="w-full flex items-center gap-3 p-3.5 glass-panel rounded-3xl border border-line hover:border-rose/40 hover:bg-white/5 transition-all group text-left min-h-[72px]"
              >
                <Avatar
                  src={match.otherUser.photos?.[0]}
                  alt={match.otherUser.name}
                  className="w-14 h-14 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-cream text-lg truncate">{match.otherUser.name}</h3>
                  <p className="text-sm text-mist truncate">
                    {match.lastMessage || 'Say hi and break the ice'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-mist/50 group-hover:text-rose group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-5">
            <div className="w-24 h-24 glass-panel rounded-full flex items-center justify-center border border-line text-mist">
              <Heart size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{q ? 'No matches found' : 'No matches yet'}</h3>
              <p className="text-mist max-w-[240px] mx-auto mt-2">
                {q
                  ? 'Try a different name.'
                  : 'When someone likes you back, they show up here.'}
              </p>
            </div>
            {!q && (
              <button onClick={() => navigate('/')} className="btn-primary max-w-[240px]">
                Discover people
              </button>
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
