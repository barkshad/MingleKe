import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, User, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navigation() {
  const navItems = [
    { icon: Compass, path: '/', label: 'Deck', end: true },
    { icon: Heart, path: '/matches', label: 'Mutual', end: false },
    { icon: MessageCircle, path: '/messages', label: 'Inbox', end: false },
    { icon: User, path: '/profile', label: 'You', end: false },
  ];

  return (
    <div className="absolute bottom-0 inset-x-0 z-50 pointer-events-none">
      <nav className="pointer-events-auto bg-ink border-t border-line grid grid-cols-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[56px] border-t-2 transition-colors',
                isActive
                  ? 'border-hibiscus text-hibiscus'
                  : 'border-transparent text-bone-dim hover:text-bone'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="type-meta text-[9px] tracking-[0.12em]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
