import React, { useEffect, useRef, useState } from 'react';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast((s) => s.show);

  useEffect(() => {
    if (!user || !matchId) return;

    const fetchMatchInfo = async () => {
      try {
        const matchDoc = await getDoc(doc(db, 'matches', matchId));
        if (!matchDoc.exists()) {
          toast('This conversation no longer exists.', 'error');
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
    };

    fetchMatchInfo();

    const q = query(collection(db, 'matches', matchId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(msgs);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user, matchId, navigate, toast]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = inputText.trim();
    if (!msgText || !user || !matchId || sending) return;

    setInputText('');
    setSending(true);
    try {
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
    } catch (err) {
      console.error(err);
      toast('Message failed to send.', 'error');
      setInputText(msgText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-cream bg-ink">
      <header className="h-20 pb-2 border-b border-line flex items-end px-3 gap-2 glass-panel sticky top-0 z-20">
        <button
          onClick={() => navigate('/matches')}
          className="p-2 text-mist hover:text-cream transition-colors min-w-[44px] min-h-[44px]"
          aria-label="Back to matches"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 flex items-center gap-3 pb-2 min-w-0">
          <Avatar
            src={otherUser?.photos?.[0]}
            alt={otherUser?.name || 'Match'}
            className="w-11 h-11 rounded-full shrink-0"
          />
          <div className="min-w-0">
            <h2 className="font-bold text-cream text-lg leading-tight truncate">
              {otherUser?.name || '…'}
            </h2>
            <p className="text-[11px] text-mist">Matched on MingleKE</p>
          </div>
        </div>
        <Link
          to="/profile/safety"
          className="p-3 mb-2 glass-panel rounded-full text-mist hover:text-rose transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Safety tips"
        >
          <Shield size={18} />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-rose" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Avatar
              src={otherUser?.photos?.[0] || PLACEHOLDER_AVATAR}
              alt={otherUser?.name || 'Match'}
              className="w-20 h-20 rounded-full"
            />
            <h3 className="text-xl font-bold">You matched with {otherUser?.name || 'someone new'}</h3>
            <p className="text-mist text-sm max-w-[240px]">Open with something real. A question beats “hey”.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex flex-col max-w-[82%]', isMine ? 'ml-auto items-end' : 'mr-auto items-start')}
                >
                  <div
                    className={cn(
                      'px-4 py-3 rounded-3xl text-[15px] font-medium break-words',
                      isMine
                        ? 'bg-rose text-white rounded-br-md'
                        : 'glass-panel border border-line text-cream rounded-bl-md'
                    )}
                  >
                    {msg.text}
                  </div>
                  {msg.createdAt?.toDate && (
                    <span className="text-[10px] text-mist/70 mt-1 px-2">
                      {new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 pb-6">
        <form onSubmit={handleSend} className="glass-panel p-1.5 rounded-full border border-line flex items-center gap-2">
          <input
            type="text"
            placeholder="Write a message…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none py-3 px-3 text-cream placeholder:text-mist/50 font-medium"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-12 h-12 rounded-full bg-rose text-white flex items-center justify-center disabled:opacity-30 transition-all active:scale-95 hover:bg-rose-deep shrink-0"
            aria-label="Send message"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
