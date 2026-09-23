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

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const userRef = useRef<FirebaseUser | null>(null);
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
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    await loadProfile(current.uid);
  }, [loadProfile]);

  const saveProfile = useCallback(async (data: Partial<UserProfile>) => {
    const current = userRef.current;
    if (!current) throw new Error('Not signed in');
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      unsubProfileRef.current?.();
      unsubProfileRef.current = null;
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
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
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, refreshProfile, saveProfile }}>
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
