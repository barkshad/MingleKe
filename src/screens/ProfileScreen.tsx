import React from 'react';
import { motion } from 'motion/react';
import { Settings, LogOut, Shield, Heart, Bell, MessageSquare, ChevronRight, Edit3 } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

export default function ProfileScreen() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/welcome');
  };

  const sections = [
    { icon: Edit3, label: 'Edit Profile', color: 'text-primary-light', bg: 'bg-primary-main/20' },
    { icon: Heart, label: 'Preferences', color: 'text-secondary-light', bg: 'bg-secondary-main/20' },
    { icon: Bell, label: 'Notifications', color: 'text-teal-400', bg: 'bg-teal-500/20' },
    { icon: Shield, label: 'Privacy & Safety', color: 'text-green-400', bg: 'bg-green-500/20' },
  ];

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-white">
      <div className="flex-1 overflow-y-auto pb-24">
        <header className="glass-panel px-6 pt-16 pb-8 rounded-b-[40px] flex flex-col items-center relative overflow-hidden border-t-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Ambient Glows */}
          <div className="absolute top-0 -left-10 w-40 h-40 bg-primary-main/20 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute top-0 -right-10 w-40 h-40 bg-secondary-main/20 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative group z-10">
            <div className="w-36 h-36 rounded-full p-1 bg-linear-to-br from-primary-main to-secondary-main shadow-[0_0_30px_rgba(191,97,255,0.4)] relative">
              <img 
                src={profile?.photos[0] || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-[#170e1b]"
              />
            </div>
            <button className="absolute bottom-1 right-1 bg-white text-primary-main p-2.5 rounded-full shadow-xl active:scale-95 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <Edit3 size={18} strokeWidth={3} />
            </button>
          </div>
          
          <h1 className="mt-6 text-3xl font-black text-white drop-shadow-md tracking-tight">{profile?.name}, {profile?.age}</h1>
          <p className="text-white/60 text-sm font-medium mt-1 uppercase tracking-widest">{profile?.gender} • {profile?.interestedIn}</p>
          
          <div className="mt-8 flex gap-4 w-full px-2">
            <div className="flex-1 glass-panel border border-white/10 p-4 rounded-[24px] text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <p className="text-primary-light font-black text-2xl drop-shadow-[0_0_10px_rgba(191,97,255,0.5)]">14</p>
              <p className="text-[9px] uppercase font-bold text-white/50 tracking-widest mt-1">Total Matches</p>
            </div>
            <div className="flex-1 glass-panel border border-white/10 p-4 rounded-[24px] text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <p className="text-secondary-light font-black text-2xl drop-shadow-[0_0_10px_rgba(255,77,141,0.5)]">42</p>
              <p className="text-[9px] uppercase font-bold text-white/50 tracking-widest mt-1">Profile Views</p>
            </div>
          </div>
        </header>

        <div className="px-5 py-8 space-y-4">
          <div className="glass-panel rounded-[32px] p-2 border border-white/10 relative overflow-hidden">
             <div className="absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
             <div className="absolute top-1/4 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
             <div className="absolute top-3/4 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {sections.map((item, idx) => (
              <button 
                key={idx}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors rounded-[24px] group relative z-10"
              >
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                  <item.icon size={22} strokeWidth={2.5} />
                </div>
                <span className="flex-1 text-left font-bold text-white text-lg drop-shadow-md">{item.label}</span>
                <ChevronRight size={20} className="text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-[32px] p-2 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-500/10 transition-colors rounded-[24px]"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <LogOut size={22} strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-left font-bold text-lg">Log Out</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-white/30 uppercase tracking-widest pt-6 font-bold">
            MingleKE Version 2.0.0
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
