'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Meeting, MeetingSummary, Task } from '@/types';
import { useApp } from '@/context/AppContext';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, showToast } = useApp();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summaries, setSummaries] = useState<Record<string, MeetingSummary>>({});
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [newWaitingRoom, setNewWaitingRoom] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mtgRes, tskRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/tasks'),
      ]);

      if (mtgRes.ok) {
        const mtgData = await mtgRes.json();
        setMeetings(mtgData.meetings || []);

        // Fetch summaries for recent meetings
        const sumMap: Record<string, MeetingSummary> = {};
        for (const m of (mtgData.meetings || []).slice(0, 4)) {
          const detailRes = await fetch(`/api/meetings/${m.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.summary) {
              sumMap[m.id] = detail.summary;
            }
          }
        }
        setSummaries(sumMap);
      }

      if (tskRes.ok) {
        const tskData = await tskRes.json();
        setTasks(tskData.tasks || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateScheduledMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a meeting title');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime = newDate && newTime ? new Date(`${newDate}T${newTime}`) : new Date(Date.now() + 3600000);

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          scheduledStartTime: scheduledDateTime.toISOString(),
          scheduledEndTime: new Date(scheduledDateTime.getTime() + 3600000).toISOString(),
          waitingRoomEnabled: newWaitingRoom,
          invitedEmails: newEmails
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          tags: ['Scheduled', 'Sync'],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Meeting scheduled successfully!');
        setShowScheduleModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewDate('');
        setNewTime('');
        setNewEmails('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        showToast(nextStatus === 'completed' ? 'Task marked complete!' : 'Task reopened');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyMeetingLink = (code: string) => {
    const link = `${window.location.origin}/meeting/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    showToast('Meeting link copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Metrics computation
  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled' || m.status === 'live');
  const pastMeetings = meetings.filter((m) => m.status === 'ended');
  const totalMeetingHours = Math.round(
    meetings.reduce((acc, m) => acc + (m.totalDurationMinutes || 45), 0) / 60
  );
  const totalParticipants = meetings.reduce((acc, m) => acc + (m.attendeesCount || 2), 0);
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const myTasks = tasks.filter(
    (t) =>
      currentUser &&
      (t.assignedPerson?.toLowerCase() === currentUser.name?.toLowerCase() ||
        t.assignedPerson?.toLowerCase() === 'alex rivera')
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'Alex'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Assistant Ready
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All meetings, live transcriptions, AI summaries, and Linear-style action items in one unified cockpit.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-border bg-secondary/60 hover:bg-secondary rounded-lg transition-colors text-foreground"
          >
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Schedule Meeting</span>
          </button>

          <button
            onClick={async () => {
              const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isInstant: true }),
              });
              if (res.ok) {
                const data = await res.json();
                router.push(`/meeting/${data.meeting.code}`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Instant Meeting</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border/80 shadow-sm hover:border-border transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Upcoming & Live</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{upcomingMeetings.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">{meetings.filter((m) => m.status === 'live').length} active now</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/80 shadow-sm hover:border-border transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Total Meeting Time</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalMeetingHours} hrs</div>
          <div className="text-[11px] text-muted-foreground mt-1">Across all team rooms</div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/80 shadow-sm hover:border-border transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Pending Action Items</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{pendingTasks.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            <span className="text-amber-500 font-semibold">{tasks.filter((t) => t.priority === 'urgent').length} urgent</span> items
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/80 shadow-sm hover:border-border transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Participants Reached</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalParticipants}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Engaged in discussions</div>
        </div>
      </div>

      {/* Main Grid: Upcoming Meetings & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Meetings (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Upcoming & Active Meetings</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {upcomingMeetings.length}
              </span>
            </div>
            <Link
              href="/meetings"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-xl">
                <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-semibold text-foreground">No meetings scheduled</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Start an instant meeting with one click or schedule your next sync with your team.
                </p>
              </div>
            ) : (
              upcomingMeetings.map((mtg) => {
                const isLive = mtg.status === 'live';
                return (
                  <div
                    key={mtg.id}
                    className={`p-4 rounded-xl bg-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isLive
                        ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-card to-card ring-1 ring-emerald-500/20'
                        : 'border-border/80 hover:border-border hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Live Now
                          </span>
                        )}
                        <h3 className="font-semibold text-sm text-foreground truncate">{mtg.title}</h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(mtg.scheduledStartTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(mtg.scheduledEndTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Host: {mtg.hostName}
                        </span>
                        <span className="font-mono text-[11px] bg-secondary px-1.5 py-0.5 rounded text-foreground">
                          {mtg.code}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyMeetingLink(mtg.code)}
                        title="Copy meeting link"
                        className="p-2 rounded-lg border border-border/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedCode === mtg.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        href={`/meeting/${mtg.code}`}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                          isLive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isLive ? 'Join Live' : 'Start'}</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tasks Assigned to Me (Linear Style) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Tasks & Action Items</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {myTasks.length}
              </span>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <span>Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No tasks assigned yet. AI will automatically extract action items during meetings!
              </div>
            ) : (
              myTasks.slice(0, 5).map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className="group flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/60 cursor-pointer transition-colors border border-transparent hover:border-border/40"
                  >
                    <button
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/40 group-hover:border-foreground'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium leading-snug truncate ${
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-400'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-2 border-t border-border/60">
              <Link
                href="/tasks"
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg hover:bg-secondary/40 transition-colors"
              >
                <span>Manage all tasks in Linear view</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Generated AI Summaries (Notion Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-foreground">Recently Generated AI Meeting Notes</h2>
          </div>
          <Link
            href="/ai-notes"
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <span>View all notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(summaries).slice(0, 2).map((sum) => (
            <div
              key={sum.id}
              className="p-5 rounded-xl bg-card border border-border/80 hover:border-blue-500/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    <Link href={`/ai-notes/${sum.meetingId}`}>{sum.title}</Link>
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Generated {new Date(sum.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                  AI Summary
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {sum.executiveSummary}
              </p>

              {/* Highlights badge list */}
              {sum.importantDecisions?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Key Decision
                  </span>
                  <div className="text-xs text-foreground bg-secondary/50 p-2 rounded-lg border border-border/60">
                    {sum.importantDecisions[0]}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {sum.actionItems.length} action items captured
                </span>
                <Link
                  href={`/ai-notes/${sum.meetingId}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Read Full Report</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-foreground mb-1">Schedule a Future Meeting</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Create an AI-monitored meeting link. Participants will receive automated summaries and action items.
            </p>

            <form onSubmit={handleCreateScheduledMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Architecture Sprint Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Agenda / Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline key discussion topics or goals..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
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
                  value={newEmails}
                  onChange={(e) => setNewEmails(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="waitingRoom"
                  checked={newWaitingRoom}
                  onChange={(e) => setNewWaitingRoom(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="waitingRoom" className="text-xs font-medium text-foreground cursor-pointer">
                  Enable Waiting Room (Host must approve guests)
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
                  {isSubmitting ? 'Creating...' : 'Schedule Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
