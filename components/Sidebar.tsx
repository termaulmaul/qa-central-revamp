'use client';

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Library,
  RefreshCcw,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronLeft,
  User,
} from 'lucide-react';
import { IconButton } from './ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeRoute: string;
  setActiveRoute: (route: string) => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  activeRoute,
  setActiveRoute,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prd-intake', label: 'PRD Intake', icon: FileText },
    { id: 'coverage-audit', label: 'Coverage Audit', icon: ShieldCheck },
    { id: 'test-catalogue', label: 'Test Catalogue', icon: Library },
    { id: 'qase-integration', label: 'Qase Integration', icon: RefreshCcw },
    { id: 'ai-playground', label: 'AI Playground', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={`h-full border-r border-zinc-800 bg-zinc-950 flex flex-col spring-transition ${
        isCollapsed ? 'w-16' : 'w-[240px]'
      }`}
      style={{ minWidth: isCollapsed ? '64px' : '240px' }}
    >
      {/* Workspace Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              QA
            </div>
            <span className="font-semibold text-sm truncate">Acme Corp</span>
          </div>
        )}
        <IconButton
          icon={isCollapsed ? ChevronRight : ChevronLeft}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={isCollapsed ? 'mx-auto' : ''}
        />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm group
              ${
                activeRoute === item.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
          >
            <item.icon
              size={16}
              strokeWidth={1.5}
              className={activeRoute === item.id ? 'text-indigo-400' : ''}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-zinc-800 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 spring-transition text-sm mt-1">
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={12} />
          </div>
          {!isCollapsed && <span>John Doe</span>}
        </button>
      </div>
    </div>
  );
}
