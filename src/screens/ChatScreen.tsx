import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, Shield } from 'lucide-react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn, PLACEHOLDER_AVATAR } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { NetworkBanner } from '../components/NetworkBanner';
import {
  isDemoThreadId,
  getDemoThread,
  appendDemoMessage,
  ensureDemoThread,
  type DemoMessage,
} from '../lib/demoChat';
import { botReply, openerFor } from '../lib/chatBot';
import { SEED_PROFILES } from '../lib/seedProfiles';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface OtherUser {
  uid: string;
  name: string;
  photos: string[];
}

export default function ChatScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast((s) => s.show);
  const demo = !!matchId && isDemoThreadId(matchId);

  const seedUid = useMemo(() => {
    if (!matchId) return '';
    // ids look like m_mem-003_<userId>
    const raw = matchId.replace(/^m_/, '').replace(/^demo-/, '');
    const uid = user?.uid || 'guest-inspect';
    if (raw.includes(`_${uid}`)) return raw.replace(`_${uid}`, '');
    if (raw.includes(`-${uid}`)) return raw.replace(`-${uid}`, '');
    const m = raw.match(/^(mem-[\w-]+|seed-[\w-]+|wa-[\w-]+)/);
    return m ? m[1] : raw.split('_')[0].split('-')[0];
  }, [matchId, user?.uid]);

  // —— demo (seed) thread ——
  useEffect(() => {
    if (!demo || !matchId) return;
    const seed = SEED_PROFILES.find((s) => s.uid === seedUid) || SEED_PROFILES.find((s) => matchId.includes(s.uid));
    setOtherUser({
      uid: seedUid || 'seed',
      name: seed?.name || 'Member',
      photos: seed?.photos || [],
    });

    const thread = getDemoThread(matchId);
    const mapped: Message[] = (thread?.messages || []).map((m: DemoMessage) => ({
      id: m.id,
      text: m.text,
      senderId: m.fromBot ? 'bot' : m.senderId,
      createdAt: { toDate: () => new Date(m.createdAt) },
    }));
    setMessages(mapped);
    setLoading(false);

    // Wait before the opener — instant “hi” after a match reads fake
    if (mapped.length === 0 && user) {
      const wait = 4500 + Math.random() * 7000;
      const timer = window.setTimeout(() => {
        void (async () => {
          setTyping(true);
          await new Promise((r) => setTimeout(r, 1800 + Math.random() * 2200));
          const open = await openerFor(seedUid || seed?.uid || 'seed', profile?.name || 'you');
          const msg: DemoMessage = {
            id: `m-${Date.now()}`,
            matchId,
            senderId: 'bot',
            text: open,
            createdAt: Date.now(),
            fromBot: true,
          };
          appendDemoMessage(matchId, msg);
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: msg.id, text: msg.text, senderId: 'bot', createdAt: { toDate: () => new Date(msg.createdAt) } },
          ]);
        })();
      }, wait);
      return () => window.clearTimeout(timer);
    }
  }, [demo, matchId, seedUid, user, profile?.name]);

  // —— live Firestore thread ——
  useEffect(() => {
    if (demo || !user || !matchId) return;

    (async () => {
      try {
        const matchDoc = await getDoc(doc(db, 'matches', matchId));
        if (!matchDoc.exists()) {
          toast('That thread is gone.', 'error');
          navigate('/matches');
          return;
        }
        const otherUserId = (matchDoc.data().users as string[]).find((id) => id !== user.uid);
        if (!otherUserId) return;
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const u = userDoc.data();
          setOtherUser({
            uid: otherUserId,
            name: u.name || 'Member',
            photos: Array.isArray(u.photos) ? u.photos.filter(Boolean) : [],
          });
        } else {
          setOtherUser({ uid: otherUserId, name: 'Member', photos: [] });
        }
      } catch (err) {
        console.error(err);
      }
    })();

    const q = query(collection(db, 'matches', matchId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [demo, matchId, user, navigate, toast]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing]);

  const pushBotReply = async (history: Array<{ senderId: string; text: string }>, userText: string) => {
    if (!matchId) return;
    // Read delay + typing time, closer to how a person texts
    const readPause = 1200 + Math.random() * 2800;
    const typeTime = Math.min(4500, 1400 + userText.length * 40 + Math.random() * 1600);
    setTyping(false);
    await new Promise((r) => setTimeout(r, readPause));
    setTyping(true);
    await new Promise((r) => setTimeout(r, typeTime));
    try {
      const reply = await botReply(seedUid || 'seed', history, userText);
      const msg: DemoMessage = {
        id: `m-${Date.now()}-bot`,
        matchId,
        senderId: 'bot',
        text: reply,
        createdAt: Date.now(),
        fromBot: true,
      };
      appendDemoMessage(matchId, msg);
      setMessages((prev) => [
        ...prev,
        { id: msg.id, text: msg.text, senderId: 'bot', createdAt: { toDate: () => new Date(msg.createdAt) } },
      ]);
    } catch {
      // silent
    } finally {
      setTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = inputText.trim();
    if (!msgText || !user || !matchId || sending) return;

    setInputText('');
    setSending(true);

    const history = messages.map((m) => ({
      senderId: m.senderId === 'bot' ? 'bot' : m.senderId,
      text: m.text,
    }));

    try {
      if (demo) {
        ensureDemoThread(seedUid, user.uid);
        const msg: DemoMessage = {
          id: `m-${Date.now()}`,
          matchId,
          senderId: user.uid,
          text: msgText.slice(0, 2000),
          createdAt: Date.now(),
        };
        appendDemoMessage(matchId, msg);
        setMessages((prev) => [
          ...prev,
          { id: msg.id, text: msg.text, senderId: user.uid, createdAt: { toDate: () => new Date(msg.createdAt) } },
        ]);
        setSending(false);
        void pushBotReply(history, msgText);
        return;
      }

      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        matchId,
        senderId: user.uid,
        text: msgText.slice(0, 2000),
        createdAt: serverTimestamp(),
        seen: false,
      });
      await updateDoc(doc(db, 'matches', matchId), {
        lastMessage: msgText.slice(0, 2000),
        lastMessageAt: serverTimestamp(),
      });
    } catch {
      toast('Message failed. Try again.', 'error');
      setInputText(msgText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-10 text-bone bg-ink min-h-0">
      <NetworkBanner />
      <header className="flex items-center gap-2 page-pad py-3 border-b border-line shrink-0">
        <button
          onClick={() => navigate('/matches')}
          className="p-2 text-bone-dim hover:text-bone min-h-[44px] min-w-[44px]"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <Avatar
          src={otherUser?.photos?.[0] || PLACEHOLDER_AVATAR}
          alt={otherUser?.name || 'Match'}
          className="w-9 h-9 object-cover object-top shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="type-display text-base normal-case tracking-normal font-semibold truncate">
            {otherUser?.name || '…'}
          </p>
          <p className="type-meta text-[10px]">Matched on MingleKE</p>
        </div>
        <Link to="/profile/safety" className="type-meta p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Safety">
          <Shield size={16} />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto page-pad py-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 border border-line border-t-hibiscus animate-spin" />
          </div>
        ) : messages.length === 0 && !typing ? (
          <div className="py-16 space-y-2">
            <p className="type-meta">New thread</p>
            <h2 className="fluid-display-sm">{otherUser?.name || 'Someone new'}</h2>
            <p className="text-sm text-bone-dim max-w-md">
              Open with a real question. “hey” dies here.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.senderId !== 'bot' && msg.senderId === user?.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex max-w-[85%]', isMine ? 'ml-auto justify-end' : 'mr-auto')}
                >
                  <div>
                    <div
                      className={cn(
                        'px-3 py-2.5 text-sm leading-snug break-words',
                        isMine ? 'bg-hibiscus text-bone' : 'bg-ink-soft border border-line text-bone'
                      )}
                    >
                      {msg.text}
                    </div>
                    {msg.createdAt?.toDate && (
                      <p className="type-meta text-[9px] mt-1">
                        {new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {typing && (
          <div className="mr-auto type-meta px-1">typing…</div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 page-pad pb-3 pt-3 border-t border-line shrink-0">
        <input
          type="text"
          placeholder="Write something real…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="input-field flex-1 py-3 min-w-0"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="btn-primary !w-auto px-4 shrink-0 flex items-center justify-center"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
