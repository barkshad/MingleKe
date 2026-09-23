import React, { useEffect, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useMatchStore } from '../store';
import { Avatar } from '../components/Avatar';
import { FreeCountdown } from '../components/FreeCountdown';

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
    return () => unsubscribe();
  }, [user, subscribeToMatches]);

  useEffect(() => () => reset(), [reset]);

  const filtered = matches.filter((m) =>
    (m.otherUser.name || '').toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col relative z-10 text-bone pb-14">
      <header className="px-4 py-3 border-b border-line">
        <h1 className="type-display text-3xl leading-none mb-3">{isMessagesView ? 'Inbox' : 'Mutual'}</h1>
        {matches.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
            <input
              type="text"
              placeholder="Search names"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field pl-9 py-2.5"
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line">
          <FreeCountdown compact />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 border border-line border-t-hibiscus animate-spin" />
          </div>
        ) : error ? (
          <div className="px-4 py-16 space-y-3">
            <p className="type-meta text-hibiscus">Could not load</p>
            <p className="text-sm text-bone-dim">{error}</p>
            <button onClick={() => user && subscribeToMatches(user.uid)} className="btn-secondary max-w-xs">
              Try again
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <ul>
            {filtered.map((match) => (
              <li key={match.id}>
                <button
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-line hover:bg-ink-soft text-left min-h-[72px]"
                >
                  <Avatar
                    src={match.otherUser.photos?.[0]}
                    alt={match.otherUser.name}
                    className="w-12 h-12 object-cover object-top shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="type-display text-lg normal-case tracking-normal font-semibold truncate">
                      {match.otherUser.name}
                    </p>
                    <p className="text-xs text-bone-dim truncate">
                      {match.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-bone-dim shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-16 space-y-3">
            <p className="type-meta">Empty</p>
            <h2 className="type-display text-3xl leading-none">
              {q ? 'Nobody by that name' : 'No mutuals yet'}
            </h2>
            <p className="text-sm text-bone-dim max-w-xs">
              {q ? 'Try another name.' : 'When both of you like, the thread shows up here.'}
            </p>
            {!q && (
              <button onClick={() => navigate('/')} className="btn-primary max-w-xs">
                Open the deck
              </button>
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
