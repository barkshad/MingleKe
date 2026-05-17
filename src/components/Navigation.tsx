import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, User, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navigation() {
  const navItems = [
    { icon: Compass, path: '/', label: 'Explore' },
    { icon: Heart, path: '/matches', label: 'Matches' },
    { icon: MessageCircle, path: '/messages', label: 'Chat', disabled: true }, // Chat matches go to matches
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 pb-4">
      {navItems.map((item, idx) => (
        <NavLink
          key={idx}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            isActive ? "text-primary-main scale-110" : "text-slate-400"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
