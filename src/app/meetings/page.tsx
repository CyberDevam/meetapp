'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Search,
  Play,
  Copy,
  Check,
  Filter,
  FileText,
  Trash2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { Meeting } from '@/types';
import { useApp } from '@/context/AppContext';

function MeetingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, showToast } = useApp();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [emails, setEmails] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowScheduleModal(true);
    }
  }, [searchParams]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const scheduledDateTime = date && time ? new Date(`${date}T${time}`) : new Date(Date.now() + 3600000);
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scheduledStartTime: scheduledDateTime.toISOString(),
          scheduledEndTime: new Date(scheduledDateTime.getTime() + 3600000).toISOString(),
          waitingRoomEnabled: waitingRoom,
          invitedEmails: emails.split(',').map((e) => e.trim()).filter(Boolean),
          tags: ['Scheduled'],
        }),
      });

      if (res.ok) {
        showToast('Meeting created successfully!');
        setShowScheduleModal(false);
        setTitle('');
        setDescription('');
        fetchMeetings();
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting and its data?')) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        showToast('Meeting deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/meeting/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    showToast('Meeting link copied!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredMeetings = meetings.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.hostName.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meetings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your live rooms, upcoming syncs, and past AI-recorded sessions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-lg border border-border/80 w-full sm:w-auto">
          {(['all', 'live', 'scheduled', 'ended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filterStatus === st
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ended' ? 'Past' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search meetings by title, tag, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {filteredMeetings.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-xl">
            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No meetings found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new meeting.</p>
          </div>
        ) : (
          filteredMeetings.map((mtg) => {
            const isLive = mtg.status === 'live';
            const isEnded = mtg.status === 'ended';

            return (
              <div
                key={mtg.id}
                className={`p-4 rounded-xl bg-card border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLive
                    ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/5 to-transparent'
                    : 'border-border/80 hover:border-border hover:shadow-sm'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        Live
                      </span>
                    )}
                    {isEnded && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
                        Completed ({mtg.totalDurationMinutes || 45} mins)
                      </span>
                    )}
                    <h3 className="font-semibold text-sm text-foreground truncate">{mtg.title}</h3>
                    {mtg.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">{mtg.description || 'No agenda description.'}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(mtg.scheduledStartTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(mtg.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {mtg.hostName}
                    </span>
                    <span className="font-mono text-[11px] bg-secondary px-1.5 py-0.5 rounded text-foreground">
                      {mtg.code}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isEnded ? (
                    <Link
                      href={`/ai-notes/${mtg.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors border border-border"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>View AI Notes</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/meeting/${mtg.code}`}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                        isLive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isLive ? 'Join Live' : 'Start'}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => copyLink(mtg.code)}
                    title="Copy share link"
                    className="p-2 rounded-lg border border-border/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedCode === mtg.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDeleteMeeting(mtg.id)}
                    title="Delete meeting"
                    className="p-2 rounded-lg border border-border/80 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-foreground mb-1">Schedule New Meeting</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Participants will receive automated AI summaries and action item conversions upon completion.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Retrospective & Strategy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Description / Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Topics to discuss, expected outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Invite Participants (comma-separated emails)
                </label>
                <input
                  type="text"
                  placeholder="sarah@meetai.io, david@meetai.io"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalWaitingRoom"
                  checked={waitingRoom}
                  onChange={(e) => setWaitingRoom(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="modalWaitingRoom" className="text-xs font-medium text-foreground cursor-pointer">
                  Require Host Approval (Waiting Room)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-muted-foreground">Loading meetings...</div>}>
      <MeetingsContent />
    </Suspense>
  );
}
