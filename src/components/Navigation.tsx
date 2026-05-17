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
    <div className="absolute bottom-6 inset-x-0 px-6 z-50 pointer-events-none">
      <nav className="glass-panel h-[72px] rounded-full flex items-center justify-around px-2 pointer-events-auto shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500",
              isActive ? "text-white scale-110" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-md" />
                )}
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'text-primary-main drop-shadow-[0_0_10px_rgba(191,97,255,0.8)]' : ''}
                />
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest transition-all duration-300 mt-1",
                  isActive ? "opacity-100 text-white" : "opacity-0 h-0 mt-0"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
