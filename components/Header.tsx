'use client';

import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { Badge } from './ui/Badge';
import { IconButton } from './ui/Button';

interface HeaderProps {
  activeRoute: string;
}

export function Header({ activeRoute }: HeaderProps) {
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    'prd-intake': 'PRD Intake',
    'coverage-audit': 'Coverage Audit',
    'test-catalogue': 'Test Catalogue',
    'qase-integration': 'Qase Integration',
    'ai-playground': 'AI Playground',
    settings: 'Settings',
  };

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Core API</span>
          <span className="text-zinc-600">/</span>
          <span className="font-medium text-zinc-100">{routeNames[activeRoute]}</span>
        </div>
        <Badge variant="default" className="bg-zinc-900">
          Production
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Mock */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-400 text-sm w-64 spring-transition hover:border-zinc-700">
          <Search size={14} />
          <span className="flex-1">Search or jump to...</span>
          <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          AI Online
        </div>
        <IconButton icon={Bell} />

        <div className="w-px h-4 bg-zinc-800 mx-1"></div>

        {/* Language Toggle */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs font-medium">
          <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-100 shadow-sm">
            ID
          </button>
          <button className="px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 spring-transition">
            EN
          </button>
        </div>

        {/* Logout */}
        <IconButton
          icon={LogOut}
          className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
        />
      </div>
    </header>
  );
}
