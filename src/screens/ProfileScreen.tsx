import React, { useEffect, useState } from 'react';
import { LogOut, Shield, Settings, ChevronRight, Edit3, Check } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { FreeCountdown } from '../components/FreeCountdown';

export default function ProfileScreen() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'matches'), where('users', 'array-contains', user.uid))
        );
        setMatchCount(snap.size);
      } catch {
        setMatchCount(0);
      }
    })();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/home');
    } catch {
      toast('Could not log out.', 'error');
    }
  };

  const rows = [
    { icon: Edit3, label: 'Edit plate', to: '/profile/edit' },
    { icon: Settings, label: 'Preferences', to: '/profile/preferences' },
    { icon: Shield, label: 'Safety', to: '/profile/safety' },
  ];

  return (
    <div className="flex-1 flex flex-col relative z-10 text-bone pb-14">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-56 border-b border-line">
          <Avatar
            src={profile?.photos?.[0]}
            alt="You"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #14110E 10%, transparent 55%)' }} />
          <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between gap-3">
            <div>
              <h1 className="nameplate text-3xl">
                {profile?.name || 'You'}
                {profile?.age ? `, ${profile.age}` : ''}
              </h1>
              <p className="type-meta mt-1">
                {(profile?.gender || '').toString()} · likes {(profile?.interestedIn || '').toString()}
              </p>
            </div>
            <Link
              to="/profile/edit"
              className="type-meta border border-line bg-ink px-3 py-2 hover:border-bone min-h-[44px] inline-flex items-center"
            >
              <Edit3 size={14} className="mr-1" />
              Edit
            </Link>
          </div>
        </div>

        {profile?.bio && (
          <p className="px-4 py-4 text-sm text-bone-dim leading-relaxed border-b border-line">{profile.bio}</p>
        )}

        <div className="grid grid-cols-2 border-b border-line">
          <div className="px-4 py-4 border-r border-line">
            <p className="font-mono text-2xl text-hibiscus tabular-nums">{matchCount}</p>
            <p className="type-meta mt-1">Mutual</p>
          </div>
          <div className="px-4 py-4">
            <p className="font-mono text-2xl tabular-nums">{profile?.photos?.length || 0}/3</p>
            <p className="type-meta mt-1">Photos</p>
          </div>
        </div>

        <div className="px-4 py-5 max-w-md">
          <FreeCountdown compact className="mb-4" />

          <nav className="border border-line divide-y divide-line rounded-md overflow-hidden mb-4">
            {rows.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-4 hover:bg-ink-soft min-h-[56px]"
              >
                <item.icon size={16} className="text-bone-dim shrink-0" />
                <span className="flex-1 type-display text-base tracking-normal normal-case font-semibold">
                  {item.label}
                </span>
                <ChevronRight size={16} className="text-bone-dim" />
              </Link>
            ))}
          </nav>

          {profile?.paymentStatus === 'completed' && (
            <p className="type-meta flex items-center gap-2 mb-4 text-moss">
              <Check size={12} /> Verified member
            </p>
          )}

          <button
            onClick={handleLogout}
            className="w-full border border-hibiscus/40 text-hibiscus type-display uppercase tracking-wider py-4 rounded-md hover:bg-hibiscus/10 min-h-[56px]"
          >
            Log out
          </button>

          <p className="type-meta mt-6 text-center">MingleKE 2.1 · Nairobi</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
