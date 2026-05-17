import { create } from 'zustand';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

interface Match {
  id: string;
  users: string[];
  otherUser: any;
  lastMessage?: string;
  lastMessageAt?: any;
}

interface MatchState {
  matches: Match[];
  loading: boolean;
  subscribeToMatches: (userId: string) => () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  loading: true,
  subscribeToMatches: (userId: string) => {
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      set({ loading: true });
      const matchPromises = snapshot.docs.map(async (matchDoc) => {
        const data = matchDoc.data();
        const otherUserId = data.users.find((id: string) => id !== userId);
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        return {
          id: matchDoc.id,
          users: data.users,
          otherUser: { uid: otherUserId, ...userDoc.data() },
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt,
        };
      });

      const results = await Promise.all(matchPromises);
      set({ 
        matches: results.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0)), 
        loading: false 
      });
    });

    return unsubscribe;
  },
}));
