import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  interestedIn: 'men' | 'women' | 'everyone';
  bio: string;
  photos: string[];
  location?: { city: string; lat?: number; lng?: number };
  interests?: string[];
  onboarded?: boolean;
  paymentStatus: 'pending' | 'completed' | 'none';
  paymentReference?: string;
  maxDistanceKm?: number;
  ageRange?: { min: number; max: number };
  showMe?: 'men' | 'women' | 'everyone';
}

const GUEST_UID = 'guest-inspect';

const guestProfile: UserProfile = {
  uid: GUEST_UID,
  name: 'Guest',
  age: 24,
  gender: 'male',
  interestedIn: 'women',
  bio: 'Inspecting MingleKE. Not a live account.',
  photos: [],
  location: { city: 'Nairobi' },
  interests: ['Tech', 'Food', 'Music'],
  onboarded: true,
  paymentStatus: 'completed',
  maxDistanceKm: 50,
  ageRange: { min: 18, max: 45 },
  showMe: 'women',
};

type SessionUser = {
  uid: string;
  isGuest: boolean;
  raw: FirebaseUser | null;
};

interface AuthContextType {
  user: SessionUser | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const userRef = useRef<SessionUser | null>(null);
  const unsubProfileRef = useRef<(() => void) | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ uid, ...docSnap.data() } as UserProfile);
      } else {
        setProfile(null);
      }
      unsubProfileRef.current?.();
      unsubProfileRef.current = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          setProfile({ uid, ...snap.data() } as UserProfile);
        }
      });
    } catch (err) {
      console.error('Failed to load profile', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    unsubProfileRef.current?.();
    unsubProfileRef.current = null;
    const session: SessionUser = { uid: GUEST_UID, isGuest: true, raw: null };
    userRef.current = session;
    setUser(session);
    setProfile(guestProfile);
    setLoading(false);
    try {
      localStorage.setItem('mingleke-guest', '1');
    } catch {
      // ignore
    }
  }, []);

  const exitGuestMode = useCallback(async () => {
    try {
      localStorage.removeItem('mingleke-guest');
    } catch {
      // ignore
    }
    unsubProfileRef.current?.();
    unsubProfileRef.current = null;
    userRef.current = null;
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    if (current.isGuest) {
      setProfile((p) => (p ? { ...p, ...guestProfile, ...p } : guestProfile));
      return;
    }
    await loadProfile(current.uid);
  }, [loadProfile]);

  const saveProfile = useCallback(async (data: Partial<UserProfile>) => {
    const current = userRef.current;
    if (!current) throw new Error('Not signed in');
    if (current.isGuest) {
      setProfile((prev) => {
        const next = { ...(prev || guestProfile), ...data, uid: GUEST_UID, onboarded: true };
        try {
          localStorage.setItem('mingleke-guest-profile', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      return;
    }
    const ref = doc(db, 'users', current.uid);
    const payload = { ...data, lastActive: new Date().toISOString() };
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { uid: current.uid, createdAt: new Date().toISOString(), ...payload });
    }
    await loadProfile(current.uid);
  }, [loadProfile]);

  useEffect(() => {
    // Restore guest session so refresh keeps you inside the app for inspection.
    try {
      if (localStorage.getItem('mingleke-guest') === '1') {
        const saved = localStorage.getItem('mingleke-guest-profile');
        const session: SessionUser = { uid: GUEST_UID, isGuest: true, raw: null };
        userRef.current = session;
        setUser(session);
        setProfile(saved ? { ...guestProfile, ...JSON.parse(saved) } : guestProfile);
        setLoading(false);
        return;
      }
    } catch {
      // fall through to Firebase
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const session: SessionUser = { uid: firebaseUser.uid, isGuest: false, raw: firebaseUser };
        userRef.current = session;
        setUser(session);
        await loadProfile(firebaseUser.uid);
      } else {
        userRef.current = null;
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubProfileRef.current?.();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        isGuest: !!user?.isGuest,
        enterGuestMode,
        exitGuestMode,
        refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
