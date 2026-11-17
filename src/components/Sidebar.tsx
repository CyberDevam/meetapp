'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  FileText,
  Radio,
  ScrollText,
  CheckSquare,
  Sparkles,
  Calendar,
  Users,
  Settings,
  Sun,
  Moon,
  Plus,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Meetings', href: '/meetings', icon: Video },
  { name: 'AI Notes', href: '/ai-notes', icon: FileText },
  { name: 'Recordings', href: '/recordings', icon: Radio },
  { name: 'Transcripts', href: '/transcripts', icon: ScrollText },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, badge: 'Linear' },
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles, highlight: true },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Team Workspace', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, activeWorkspace, theme, toggleTheme, workspaces, switchWorkspace } = useApp();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);

  // If in meeting room full screen, hide sidebar
  if (pathname.startsWith('/meeting/')) {
    return null;
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Top Workspace Selector & Brand */}
      <div>
        <div className="p-4 border-b border-border/80">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                MeetAI Suite
              </span>
              <span className="block text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Enterprise AI
              </span>
            </div>
          </div>

          {/* Workspace Switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/60 bg-secondary/50 hover:bg-secondary text-xs text-left transition-colors"
            >
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-medium">Workspace</span>
                <span className="font-semibold text-foreground truncate block">
                  {activeWorkspace?.name || 'Acme Workspace'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 flex-shrink-0" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
                  Select Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-accent ${
                      ws.id === activeWorkspace?.id ? 'text-primary font-bold' : 'text-foreground'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === activeWorkspace?.id && <span className="text-[10px] text-primary">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                } ${item.highlight && !isActive ? 'text-blue-400 font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-primary-foreground' : item.highlight ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Theme */}
      <div className="p-3 border-t border-border/80 space-y-2">
        {/* Quick Instant Meet Button */}
        <Link
          href="/meetings?action=new"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Meeting</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/40">
          <div className="flex items-center gap-2 truncate">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {currentUser?.name?.[0] || 'U'}
              </div>
            )}
            <div className="truncate text-left">
              <span className="text-xs font-semibold text-foreground block truncate">
                {currentUser?.name || 'Alex Rivera'}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                <span>{currentUser?.role || 'Admin'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
