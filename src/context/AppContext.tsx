'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Workspace } from '@/types';

interface AppContextType {
  currentUser: UserProfile | null;
  activeWorkspace: Workspace | null;
  users: UserProfile[];
  workspaces: Workspace[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchUser: (userId: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const refreshAuth = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.currentUser);
        setActiveWorkspace(data.activeWorkspace);
        setUsers(data.users || []);
        setWorkspaces(data.workspaces || []);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  useEffect(() => {
    refreshAuth();
    // Default to dark mode for high-tech premium aesthetic
    const savedTheme = (localStorage.getItem('meetapp_theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('meetapp_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const switchUser = async (userId: string) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: userId }),
      });
      await refreshAuth();
      showToast('Switched user profile');
    } catch (e) {
      console.error(e);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeWorkspaceId: workspaceId }),
      });
      await refreshAuth();
      showToast('Switched organization workspace');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeWorkspace,
        users,
        workspaces,
        theme,
        toggleTheme,
        switchUser,
        switchWorkspace,
        refreshAuth,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
