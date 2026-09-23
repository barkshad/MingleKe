import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Shield,
  Heart,
  Settings,
  ChevronRight,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';

export default function ProfileScreen() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'matches'), where('users', 'array-contains', user.uid))
        );
        setMatchCount(snap.size);
      } catch {
        setMatchCount(0);
      }
    };
    load();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/welcome');
    } catch {
      toast('Could not log out. Try again.', 'error');
    }
  };

  const sections = [
    {
      icon: Edit3,
      label: 'Edit profile',
      to: '/profile/edit',
      color: 'text-rose',
      bg: 'bg-rose/15',
    },
    {
      icon: Settings,
      label: 'Preferences',
      to: '/profile/preferences',
      color: 'text-amber',
      bg: 'bg-amber/15',
    },
    {
      icon: Shield,
      label: 'Privacy & safety',
      to: '/profile/safety',
      color: 'text-sage',
      bg: 'bg-sage/15',
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-cream">
      <div className="flex-1 overflow-y-auto pb-28">
        <header className="glass-panel px-6 pt-14 pb-8 rounded-b-[36px] flex flex-col items-center relative overflow-hidden border-t-0">
          <div className="absolute top-0 -left-10 w-36 h-36 bg-rose/15 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute top-0 -right-10 w-36 h-36 bg-[#ff8a5b]/10 rounded-full blur-[40px] pointer-events-none" />

          <div className="relative z-10">
            <Avatar
              src={profile?.photos?.[0]}
              alt="You"
              className="w-32 h-32 rounded-full border-4 border-ink object-cover"
            />
            <Link
              to="/profile/edit"
              className="absolute bottom-0 right-0 bg-rose text-white p-2.5 rounded-full active:scale-95 transition-transform"
              aria-label="Edit profile photo"
            >
              <Edit3 size={16} strokeWidth={3} />
            </Link>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            {profile?.name || 'You'}
            {profile?.age ? `, ${profile.age}` : ''}
          </h1>
          <p className="text-mist text-sm font-medium mt-1 uppercase tracking-widest">
            {(profile?.gender || '').toString()} · likes {(profile?.interestedIn || '').toString()}
          </p>
          {profile?.bio && (
            <p className="text-cream/80 text-sm mt-3 max-w-[280px] text-center leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-6 flex gap-3 w-full px-1">
            <div className="flex-1 glass-panel border border-line p-4 rounded-3xl text-center">
              <p className="text-rose font-bold text-2xl">{matchCount}</p>
              <p className="text-[10px] uppercase font-bold text-mist tracking-widest mt-1">Matches</p>
            </div>
            <div className="flex-1 glass-panel border border-line p-4 rounded-3xl text-center">
              <p className="text-cream font-bold text-2xl">{profile?.photos?.length || 0}/3</p>
              <p className="text-[10px] uppercase font-bold text-mist tracking-widest mt-1">Photos</p>
            </div>
          </div>
        </header>

        <div className="px-5 py-7 space-y-3">
          <div className="glass-panel rounded-[28px] p-2 border border-line">
            {sections.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-white/5 transition-colors rounded-3xl group min-h-[56px]"
              >
                <div className={`w-11 h-11 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shrink-0`}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="flex-1 text-left font-bold text-cream text-base">{item.label}</span>
                <ChevronRight size={18} className="text-mist/50 group-hover:text-cream group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          {profile?.paymentStatus === 'completed' && (
            <div className="glass-panel rounded-[28px] p-4 border border-sage/30 flex items-center gap-3">
              <Sparkles size={20} className="text-sage shrink-0" />
              <p className="text-sm text-mist">
                <span className="text-sage font-bold">Verified</span> member. Thanks for helping keep MingleKE genuine.
              </p>
            </div>
          )}

          <div className="glass-panel rounded-[28px] p-2 border border-rose/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3.5 text-rose hover:bg-rose/10 transition-colors rounded-3xl min-h-[56px]"
            >
              <div className="w-11 h-11 bg-rose/15 rounded-2xl flex items-center justify-center shrink-0">
                <LogOut size={20} strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-left font-bold text-base">Log out</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-mist/60 pt-4 font-medium">
            MingleKE 2.1 · Made for Kenya
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
