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
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="h-20 border-b border-gray-100 flex items-center px-4 gap-3 bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/matches')} className="p-2 -ml-2 text-gray-500">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            {otherUser && <img src={otherUser.photos[0]} alt={otherUser.name} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">{otherUser?.name || '...'}</h2>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-primary-main opacity-50"><Phone size={20} /></button>
          <button className="p-2 text-primary-main opacity-50"><Video size={20} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-main" />
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
                    "px-4 py-3 rounded-2xl text-sm font-medium shadow-sm",
                    isMine 
                      ? "bg-primary-main text-white rounded-br-none" 
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                  )}>
                    {msg.text}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
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
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 pb-10">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-hidden py-2 text-sm"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-all active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
