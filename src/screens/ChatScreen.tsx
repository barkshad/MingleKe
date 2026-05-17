import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Info, Send, Phone, Video } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !matchId) return;

    // Fetch match info and other user
    const fetchMatchInfo = async () => {
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (matchDoc.exists()) {
        const otherUserId = matchDoc.data().users.find((id: string) => id !== user.uid);
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          setOtherUser({ uid: otherUserId, ...userDoc.data() } as OtherUser);
        }
      }
    };

    fetchMatchInfo();

    // Listen for messages
    const q = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, matchId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !matchId) return;

    const msgText = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        matchId,
        senderId: user.uid,
        text: msgText,
        createdAt: serverTimestamp(),
      });

      // Update match last message
      await updateDoc(doc(db, 'matches', matchId), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-white bg-black/40">
      {/* Header */}
      <header className="h-24 pb-4 border-b border-white/10 flex items-end px-4 gap-3 glass-panel sticky top-0 z-20">
        <button onClick={() => navigate('/matches')} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ChevronLeft size={32} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden ">
            {otherUser && <img src={otherUser.photos[0]} alt={otherUser.name} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h2 className="font-bold text-white text-xl leading-tight">{otherUser?.name || '...'}</h2>
            <p className="text-[9px] text-teal-400 font-bold uppercase tracking-[0.2em] ">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 glass-panel rounded-full text-white/70 hover:text-gray-400 active:scale-95 transition-all"><Phone size={18} /></button>
          <button className="p-3 glass-panel rounded-full text-white/70 hover:text-gray-400 active:scale-95 transition-all"><Video size={18} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-5 py-3.5 rounded-[24px] text-base font-medium  max-w-full backdrop-blur-md",
                    isMine 
                      ? "text-white rounded-br-sm " 
                      : "glass-panel border border-white/10 text-white rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[9px] text-white/40 mt-1.5 px-2 font-bold tracking-widest uppercase">
                      {format(msg.createdAt.toDate(), 'HH:mm')}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-transparent pb-8">
        <form onSubmit={handleSend} className="glass-panel p-2 rounded-full border border-white/20 ">
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-1">
            <input
              type="text"
              placeholder="Message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-hidden py-3 text-white placeholder:text-white/40 font-medium text-base"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:grayscale transition-all active:scale-90 "
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
