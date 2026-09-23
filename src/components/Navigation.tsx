import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, User, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navigation() {
  const navItems = [
    { icon: Compass, path: '/', label: 'Discover', end: true },
    { icon: Heart, path: '/matches', label: 'Matches', end: false },
    { icon: MessageCircle, path: '/messages', label: 'Chats', end: false },
    { icon: User, path: '/profile', label: 'You', end: false },
  ];

  return (
    <div className="absolute bottom-5 inset-x-0 px-5 z-50 pointer-events-none">
      <nav className="glass-panel h-[68px] rounded-full flex items-center justify-around px-2 pointer-events-auto shadow-2xl shadow-black/40">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-200 min-w-[44px] min-h-[44px]',
                isActive
                  ? 'text-rose scale-105'
                  : 'text-mist hover:text-cream hover:bg-white/5'
              )
            }
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-rose/15 rounded-full" />
                )}
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="relative z-10"
                />
                <span
                  className={cn(
                    'relative z-10 text-[9px] font-bold uppercase tracking-wider transition-all',
                    isActive ? 'opacity-100 mt-0.5' : 'sr-only'
                  )}
                >
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
