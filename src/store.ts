import { create } from 'zustand';
import { collection, query, where, onSnapshot, getDoc, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { withTimeout } from './lib/network';

export interface MatchUser {
  uid: string;
  name: string;
  photos: string[];
  bio?: string;
  age?: number;
  lastActive?: unknown;
  /** Optional UI extras used by seed/demo cards */
  gender?: string;
  location?: { city: string; distanceLabel?: string };
  interests?: string[];
  verified?: boolean;
}

export interface Match {
  id: string;
  users: string[];
  otherUser: MatchUser;
  lastMessage?: string;
  lastMessageAt?: any;
}

interface MatchState {
  matches: Match[];
  loading: boolean;
  error: string | null;
  subscribeToMatches: (userId: string) => () => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  loading: true,
  error: null,
  reset: () => set({ matches: [], loading: true, error: null }),
  subscribeToMatches: (userId: string) => {
    set({ loading: true, error: null });
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const matchPromises = snapshot.docs.map(async (matchDoc) => {
            const data = matchDoc.data();
            const otherUserId = (data.users as string[]).find((id) => id !== userId);
            if (!otherUserId) return null;
            let otherUser: MatchUser = { uid: otherUserId, name: 'Member', photos: [] };
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                const u = userDoc.data();
                otherUser = {
                  uid: otherUserId,
                  name: u.name || 'Member',
                  photos: Array.isArray(u.photos) ? u.photos.filter(Boolean) : [],
                  bio: u.bio,
                  age: u.age,
                  lastActive: u.lastActive,
                };
              }
            } catch {
              // deleted or permission edge — keep placeholder
            }
            return {
              id: matchDoc.id,
              users: data.users,
              otherUser,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
            } as Match;
          });

          const results = (await Promise.all(matchPromises)).filter(Boolean) as Match[];
          results.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
          set({ matches: results, loading: false, error: null });
        } catch (err: any) {
          set({ loading: false, error: err?.message || 'Could not load matches' });
        }
      },
      (err) => {
        set({ loading: false, error: err.message || 'Could not load matches' });
      }
    );

    return unsubscribe;
  },
}));

export interface DiscoveryFilters {
  interestedIn: 'men' | 'women' | 'everyone';
  minAge: number;
  maxAge: number;
  city?: string;
}

export async function fetchDiscoveryProfiles(
  currentUid: string,
  filters: DiscoveryFilters,
  excludeUids: string[]
): Promise<MatchUser[]> {
  const q = query(collection(db, 'users'), where('onboarded', '==', true));
  // Low networks: never hang the deck on Firestore — time out and use seeds.
  const snap = await withTimeout(getDocs(q), 8000, 'Profile load');
  const exclude = new Set([currentUid, ...excludeUids]);
  const results: MatchUser[] = [];

  snap.forEach((d) => {
    if (exclude.has(d.id)) return;
    const u = d.data();
    const gender = u.gender;
    const age = Number(u.age) || 0;
    const interestedIn = filters.interestedIn || u.showMe || 'everyone';

    if (interestedIn === 'men' && gender !== 'male') return;
    if (interestedIn === 'women' && gender !== 'female') return;
    if (age && (age < filters.minAge || age > filters.maxAge)) return;
    if (filters.city && u.location?.city && u.location.city !== filters.city) return;

    results.push({
      uid: d.id,
      name: u.name || 'Member',
      photos: Array.isArray(u.photos) ? u.photos.filter(Boolean) : [],
      bio: u.bio,
      age: u.age,
      gender: u.gender,
      location: u.location
        ? {
            city: u.location.city || 'Nearby',
            distanceLabel: u.location.city && u.location.city !== 'Nearby' ? undefined : 'Nearby',
          }
        : undefined,
      interests: Array.isArray(u.interests) ? u.interests : [],
      verified: u.paymentStatus === 'completed',
    });
  });

  return results.sort(() => Math.random() - 0.5);
}

export async function getSwipedUids(userId: string): Promise<{ liked: string[]; passed: string[] }> {
  const liked: string[] = [];
  const passed: string[] = [];
  try {
    const q = query(collection(db, 'likes'), where('senderId', '==', userId));
    const snap = await withTimeout(getDocs(q), 6000, 'Swipe history');
    snap.forEach((d) => {
      const data = d.data();
      if (data.action === 'pass') passed.push(data.receiverId);
      else liked.push(data.receiverId);
    });
  } catch {
    // offline / timeout — local ledger still applies via exclude list
  }
  return { liked, passed };
}
