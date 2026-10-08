'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Keyboard, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface TopHeaderProps {
  onOpenShortcuts?: () => void;
  currentTime?: string;
  isSimulation?: boolean;
}

export function TopHeader({ onOpenShortcuts }: TopHeaderProps) {
  const { currentUser, setCurrentUser, users } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:px-6 whitespace-nowrap select-none shadow-xs">
      {/* Left: TIDEMESH wordmark in emergency-signage condensed font */}
      <Link
        href="/"
        className="font-display font-extrabold text-[1.6rem] tracking-[0.06em] uppercase leading-none text-[#0F172A] transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-sm"
        aria-label="TideMesh Overview"
      >
        TIDEMESH
      </Link>

      {/* Right: Profile Avatar Button with Role-Based User Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 min-h-[44px] cursor-pointer"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label={`User menu for ${currentUser.name} (${currentUser.roleTitle})`}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs select-none"
            title={`${currentUser.name} (${currentUser.roleTitle})`}
          >
            {currentUser.avatarInitials}
          </div>

          <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
            <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
              {currentUser.roleTitle}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            className="absolute right-0 mt-1 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-slate-900"
            role="menu"
          >
            {/* User Info Header */}
            <div className="px-3.5 py-2 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">{currentUser.roleTitle}</div>
            </div>

            {/* Switch User (Role-based auth with mock users) */}
            <div className="px-3.5 py-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Switch Role / User
              </div>
              <div className="space-y-1">
                {users.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left min-h-[36px]',
                        isSelected
                          ? 'bg-slate-100 text-slate-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {u.avatarInitials}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="truncate">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal truncate">
                            {u.roleTitle}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100 my-1" />

            {/* Keyboard Shortcuts Trigger */}
            {onOpenShortcuts && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenShortcuts();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left min-h-[44px]"
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-slate-500" />
                  <span>Keyboard shortcuts</span>
                </div>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] rounded">
                  ?
                </kbd>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
