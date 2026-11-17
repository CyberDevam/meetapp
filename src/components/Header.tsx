'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Video, KeyRound, Sparkles, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const router = useRouter();
  const { showToast } = useApp();
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isInstantCreating, setIsInstantCreating] = useState(false);

  const handleInstantMeeting = async () => {
    setIsInstantCreating(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isInstant: true,
          title: `Instant Meeting ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Instant meeting created! Launching...');
        router.push(`/meeting/${data.meeting.code}`);
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating meeting');
    } finally {
      setIsInstantCreating(false);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCodeInput.trim().replace(/^https?:\/\/[^\/]+\/meeting\//, '');
    if (!cleanCode) {
      showToast('Please enter a valid meeting link or code');
      return;
    }
    setShowJoinModal(false);
    router.push(`/meeting/${cleanCode}`);
  };

  return (
    <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Meeting Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search meetings, transcripts, AI summaries, or tasks..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.currentTarget.value;
                if (target.trim()) {
                  router.push(`/transcripts?q=${encodeURIComponent(target)}`);
                }
              }
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-secondary/50 border border-border/80 rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Join with code */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border/80 rounded-lg hover:bg-secondary transition-colors text-foreground"
        >
          <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Join with Code</span>
        </button>

        {/* Start Instant Meeting */}
        <button
          onClick={handleInstantMeeting}
          disabled={isInstantCreating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isInstantCreating ? 'Launching...' : 'Start Instant Meeting'}</span>
        </button>

        {/* AI Assistant Quick Pill */}
        <button
          onClick={() => router.push('/assistant')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Ask AI</span>
        </button>
      </div>

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-base font-bold text-foreground mb-1">Join a Meeting</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter the meeting code (e.g. <span className="font-mono text-primary">q4-plan-syn</span>) or paste the complete meeting link.
            </p>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Meeting Code or Link
                </label>
                <input
                  type="text"
                  autoFocus
                  value={meetingCodeInput}
                  onChange={(e) => setMeetingCodeInput(e.target.value)}
                  placeholder="abc-defg-hij"
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
