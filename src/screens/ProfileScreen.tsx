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
    { icon: Edit3, label: 'Edit Profile', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Heart, label: 'Preferences', color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: Bell, label: 'Notifications', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: Shield, label: 'Privacy & Safety', color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-slate-100 p-1">
              <img 
                src={profile?.photos[0] || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button className="absolute bottom-1 right-1 bg-primary-main text-white p-2 rounded-full shadow-lg border-2 border-white">
              <Edit3 size={16} />
            </button>
          </div>
          
          <h1 className="mt-4 text-2xl font-black text-slate-800">{profile?.name}, {profile?.age}</h1>
          <p className="text-slate-500 text-sm">{profile?.gender} • {profile?.interestedIn} • Nairobi</p>
          
          <div className="mt-6 flex gap-3 w-full">
            <div className="flex-1 bg-purple-50 p-3 rounded-2xl text-center">
              <p className="text-primary-main font-black text-lg">14</p>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Matches</p>
            </div>
            <div className="flex-1 bg-pink-50 p-3 rounded-2xl text-center">
              <p className="text-secondary-main font-black text-lg">42</p>
              <p className="text-[10px] uppercase font-bold text-slate-400">Profile Views</p>
            </div>
          </div>
        </header>

        <div className="px-6 py-8 space-y-4">
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
            {sections.map((item, idx) => (
              <button 
                key={idx}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group"
              >
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                  <item.icon size={20} />
                </div>
                <span className="flex-1 text-left font-bold text-slate-700">{item.label}</span>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-main transition-colors" />
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 transition-colors rounded-2xl"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="flex-1 text-left font-bold">Log Out</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-300 uppercase tracking-widest pt-4">
            MingleKE Version 1.0.0 (MVP)
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
