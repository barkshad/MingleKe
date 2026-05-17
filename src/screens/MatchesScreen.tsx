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
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <header className="p-6 pb-2">
        <h1 className="text-3xl font-black text-gray-900 mb-4">Matches</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search matches" 
            className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-main/20"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-main"></div>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2 mt-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Your Interactions</h2>
            {matches.map((match) => (
              <motion.button
                key={match.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="w-full flex items-center gap-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <img 
                    src={match.otherUser.photos[0]} 
                    alt={match.otherUser.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900">{match.otherUser.name}</h3>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                    {match.lastMessage || 'Start the conversation! 👋'}
                  </p>
                </div>
                <div className="text-right">
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Heart size={40} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">No matches yet</h3>
              <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Start swiping to find someone you connect with!</p>
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
