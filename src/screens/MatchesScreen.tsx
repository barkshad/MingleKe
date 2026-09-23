import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useMatchStore, type Match } from '../store';
import { Avatar } from '../components/Avatar';
import { FreeCountdown } from '../components/FreeCountdown';
import { NetworkBanner } from '../components/NetworkBanner';
import { listDemoThreads, type DemoThread } from '../lib/demoChat';
import { thumbFor } from '../components/SmartImage';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { matches, loading, error, subscribeToMatches, reset } = useMatchStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [demoThreads, setDemoThreads] = useState<DemoThread[]>([]);
  const isMessagesView = location.pathname === '/messages';

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMatches(user.uid);
    return () => unsubscribe();
  }, [user, subscribeToMatches]);

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    const sync = () => setDemoThreads(listDemoThreads());
    sync();
    window.addEventListener('focus', sync);
    const id = window.setInterval(sync, 1500);
    return () => {
      window.removeEventListener('focus', sync);
      window.clearInterval(id);
    };
  }, []);

  const rows = useMemo(() => {
    const live: Array<{ id: string; name: string; photo?: string; preview: string; at: number }> = matches.map(
      (m: Match) => ({
        id: m.id,
        name: m.otherUser.name,
        photo: m.otherUser.photos?.[0],
        preview: m.lastMessage || 'No messages yet',
        at: m.lastMessageAt?.seconds ? m.lastMessageAt.seconds * 1000 : 0,
      })
    );
    const demo = demoThreads.map((t) => ({
      id: t.id,
      name: t.name,
      photo: t.photo,
      preview: t.lastMessage || 'Say hi — they are set up to reply',
      at: t.lastMessageAt || 0,
    }));
    return [...live, ...demo]
      .filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => b.at - a.at);
  }, [matches, demoThreads, q]);

  const busy = loading && rows.length === 0;

  return (
    <div className="flex-1 flex flex-col relative z-10 text-bone pb-14 min-h-0">
      <NetworkBanner />
      <header className="page-pad py-3 border-b border-line shrink-0">
        <h1 className="fluid-display-sm mb-3">{isMessagesView ? 'Inbox' : 'Mutual'}</h1>
        {(rows.length > 0 || demoThreads.length > 0) && (
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

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="page-pad py-3 border-b border-line">
          <FreeCountdown compact />
        </div>

        {busy ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 border border-line border-t-hibiscus animate-spin" />
          </div>
        ) : error && rows.length === 0 && demoThreads.length === 0 ? (
          <div className="page-pad py-16 space-y-3">
            <p className="type-meta text-hibiscus">Could not load live matches</p>
            <p className="text-sm text-bone-dim">{error}</p>
            <p className="text-sm text-bone-dim">Seed chats still work offline.</p>
            <button onClick={() => navigate('/')} className="btn-secondary max-w-md">
              Open the deck
            </button>
          </div>
        ) : rows.length > 0 ? (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate(`/chat/${row.id}`)}
                  className="w-full flex items-center gap-3 page-pad py-3 border-b border-line hover:bg-ink-soft text-left min-h-[72px]"
                >
                  <Avatar
                    src={row.photo || thumbFor(row.photo)}
                    alt={row.name}
                    className="w-12 h-12 object-cover object-top shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="type-display text-lg normal-case tracking-normal font-semibold truncate">
                      {row.name}
                    </p>
                    <p className="text-xs text-bone-dim truncate">{row.preview}</p>
                  </div>
                  {row.id.startsWith('demo-') ? (
                    <MessageSquare size={14} className="text-hibiscus shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-bone-dim shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="page-pad py-16 space-y-3">
            <p className="type-meta">Empty</p>
            <h2 className="fluid-display-sm">
              {q ? 'Nobody by that name' : 'No mutuals yet'}
            </h2>
            <p className="text-sm text-bone-dim max-w-md">
              {q
                ? 'Try another name.'
                : 'Like a plate from the deck — seed members open an inbox and reply to you.'}
            </p>
            {!q && (
              <button onClick={() => navigate('/')} className="btn-primary max-w-md">
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
