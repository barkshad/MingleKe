import React, { useEffect, useMemo, useState } from 'react';
import { Search, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useMatchStore } from '../store';
import { Avatar } from '../components/Avatar';
import { FreeCountdown } from '../components/FreeCountdown';
import { NetworkBanner } from '../components/NetworkBanner';
import { listDemoThreads, type DemoThread } from '../lib/demoChat';

type Row = {
  id: string;
  name: string;
  photo?: string;
  preview: string;
  at: number;
  bio?: string;
  city?: string;
};

export default function MatchesScreen() {
  const { user } = useAuth();
  const { matches, loading, error, subscribeToMatches, reset } = useMatchStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesView = location.pathname === '/messages';
  const [q, setQ] = useState('');
  const [demoThreads, setDemoThreads] = useState<DemoThread[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMatches(user.uid);
    return () => unsubscribe();
  }, [user, subscribeToMatches]);

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    const sync = () => setDemoThreads(listDemoThreads());
    sync();
    const id = window.setInterval(sync, 2000);
    return () => window.clearInterval(id);
  }, []);

  const all = useMemo(() => {
    const live: Row[] = matches.map((m) => ({
      id: m.id,
      name: m.otherUser.name,
      photo: m.otherUser.photos?.[0],
      preview: m.lastMessage || 'No messages yet',
      at: m.lastMessageAt?.seconds ? m.lastMessageAt.seconds * 1000 : 0,
    }));
    const demo: Row[] = demoThreads.map((t) => ({
      id: t.id,
      name: t.name,
      photo: t.photo,
      preview: t.lastMessage || 'New match',
      at: t.lastMessageAt || 0,
    }));
    return [...live, ...demo].sort((a, b) => b.at - a.at);
  }, [matches, demoThreads]);

  // Mutual = everyone you matched with (fresh too). Inbox = threads with messages.
  const mutual = useMemo(() => {
    const base = all.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));
    return base;
  }, [all, q]);

  const inbox = useMemo(
    () =>
      mutual.filter(
        (r) => r.at > 0 || (r.preview && r.preview !== 'New match' && r.preview !== 'No messages yet')
      ),
    [mutual]
  );

  const list = isMessagesView ? inbox : mutual;
  const busy = loading && all.length === 0;

  return (
    <div className="flex-1 flex flex-col relative z-10 text-bone pb-14 min-h-0">
      <NetworkBanner />
      <header className="page-pad py-3 border-b border-line shrink-0">
        <div className="flex items-end justify-between gap-3 mb-3">
          <h1 className="fluid-display-sm">{isMessagesView ? 'Inbox' : 'Mutual'}</h1>
          <div className="type-meta flex gap-3">
            <Link to="/matches" className={isMessagesView ? 'text-bone-dim' : 'text-hibiscus'}>
              Mutual {mutual.length}
            </Link>
            <Link to="/messages" className={isMessagesView ? 'text-hibiscus' : 'text-bone-dim'}>
              Inbox {inbox.length}
            </Link>
          </div>
        </div>
        {!isMessagesView && (
          <p className="type-meta mb-3">People you matched with. Tap to open their chat.</p>
        )}
        {isMessagesView && (
          <p className="type-meta mb-3">Chats with messages only. Mutual is the full match list.</p>
        )}
        {list.length > 0 && (
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
        ) : error && list.length === 0 ? (
          <div className="page-pad py-16 space-y-3">
            <p className="type-meta text-hibiscus">Could not load</p>
            <p className="text-sm text-bone-dim">{error}</p>
            <button onClick={() => navigate('/')} className="btn-secondary max-w-md">
              Open the deck
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="page-pad py-16 space-y-3">
            <p className="type-meta">Empty</p>
            <h2 className="fluid-display-sm">
              {q
                ? 'Nobody by that name'
                : isMessagesView
                  ? 'No chats yet'
                  : 'No mutuals yet'}
            </h2>
            <p className="text-sm text-bone-dim max-w-md">
              {q
                ? 'Try another name.'
                : isMessagesView
                  ? 'Open Mutual and message someone. Threads show up here after the first text.'
                  : 'Like people on the deck. When you both like, they land here.'}
            </p>
            {!q && (
              <button onClick={() => navigate(isMessagesView ? '/matches' : '/')} className="btn-primary max-w-md">
                {isMessagesView ? 'See mutuals' : 'Open the deck'}
              </button>
            )}
          </div>
        ) : !isMessagesView ? (
          /* Mutual: photo grid — no last-message spoiler */
          <div className="page-pad py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mutual.map((row) => (
                <button
                  key={row.id}
                  onClick={() => navigate(`/chat/${row.id}`)}
                  className="relative aspect-[3/4] plate overflow-hidden group text-left"
                >
                  <Avatar src={row.photo} alt={row.name} className="absolute inset-0 w-full h-full" />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, #14110E 20%, transparent 55%)' }}
                  />
                  <div className="absolute left-1.5 right-1.5 bottom-1.5 z-10">
                    <p className="nameplate text-xs sm:text-sm max-w-full truncate">{row.name}</p>
                  </div>
                  {row.at === 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-hibiscus" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Inbox: message list */
          <ul>
            {inbox.map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate(`/chat/${row.id}`)}
                  className="w-full flex items-center gap-3 page-pad py-3 border-b border-line hover:bg-ink-soft text-left min-h-[72px]"
                >
                  <Avatar src={row.photo} alt={row.name} className="w-12 h-12 object-cover object-top shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="type-display text-lg normal-case tracking-normal font-semibold truncate">
                      {row.name}
                    </p>
                    <p className="text-xs text-bone-dim truncate">{row.preview}</p>
                  </div>
                  <MessageSquare size={14} className="text-hibiscus shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Navigation />
    </div>
  );
}
