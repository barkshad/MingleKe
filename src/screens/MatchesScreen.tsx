import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Heart, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useMatchStore } from '../store';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { matches, loading, subscribeToMatches } = useMatchStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToMatches(user.uid);
      return () => unsubscribe();
    }
  }, [user, subscribeToMatches]);

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-white">
      <header className="p-6 pb-4">
        <h1 className="text-4xl font-bold text-white  mb-6">Matches</h1>
        <div className="relative">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text" 
            placeholder="Search matches" 
            className="w-full glass-panel border border-white/20 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-white/20 font-medium text-lg transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3 mt-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Your Interactions</h2>
            {matches.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="w-full flex items-center gap-4 p-4 glass-panel rounded-[24px] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <div className="relative">
                  <img 
                    src={match.otherUser.photos[0]} 
                    alt={match.otherUser.name} 
                    className="w-16 h-16 rounded-full object-cover "
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#170e1b] rounded-full "></div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white text-lg group-hover:text-gray-400 transition-colors">{match.otherUser.name}</h3>
                  <p className="text-sm text-white/50 truncate max-w-[200px] font-medium">
                    {match.lastMessage || 'Start the conversation! 👋'}
                  </p>
                </div>
                <div className="text-right">
                  <ChevronRight size={22} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 glass-panel rounded-full flex items-center justify-center border border-white/10 text-white/20 ">
              <Heart size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-white ">No matches yet</h3>
              <p className="text-base text-white/50 max-w-[220px] mx-auto mt-2">Start swiping to find someone you connect with!</p>
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
