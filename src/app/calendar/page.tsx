'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Download,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Meeting } from '@/types';
import { useApp } from '@/context/AppContext';

export default function CalendarPage() {
  const { showToast } = useApp();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Quick Schedule Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const data = await res.json();
          setMeetings(data.meetings || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (dayNum: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    setSelectedDay(d.toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const scheduledDateTime = new Date(`${selectedDay}T${time}:00`);
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          scheduledStartTime: scheduledDateTime.toISOString(),
          scheduledEndTime: new Date(scheduledDateTime.getTime() + 3600000).toISOString(),
          tags: ['Calendar'],
        }),
      });

      if (res.ok) {
        showToast('Meeting added to calendar!');
        setShowModal(false);
        setTitle('');
        const refresh = await fetch('/api/meetings');
        if (refresh.ok) {
          const data = await refresh.json();
          setMeetings(data.meetings || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportICS = (meeting: Meeting) => {
    const start = new Date(meeting.scheduledStartTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(meeting.scheduledEndTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MeetAI//EN\nBEGIN:VEVENT\nSUMMARY:${meeting.title}\nDESCRIPTION:${meeting.description || 'MeetAI Meeting'}\nDTSTART:${start}\nDTEND:${end}\nURL:${window.location.origin}/meeting/${meeting.code}\nEND:VEVENT\nEND:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    showToast('ICS Calendar invite downloaded!');
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Integrated Calendar</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Schedule recurring syncs, manage time zones, and sync directly with Google Calendar & Outlook.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs px-3 text-foreground">{monthName}</span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDay(new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Sync</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border/60 bg-secondary/40 text-center py-2.5 text-xs font-bold text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 bg-secondary/10" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayMeetings = meetings.filter(
              (m) => m.scheduledStartTime.split('T')[0] === dateStr
            );
            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`h-32 p-2 hover:bg-secondary/30 transition-colors flex flex-col justify-between cursor-pointer group ${
                  isToday ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-20">
                  {dayMeetings.map((m) => (
                    <div
                      key={m.id}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400 truncate flex items-center justify-between group/mtg"
                    >
                      <Link href={`/meeting/${m.code}`} className="truncate hover:underline">
                        {m.title}
                      </Link>
                      <button
                        onClick={() => exportICS(m)}
                        title="Download .ICS invite"
                        className="opacity-0 group-hover/mtg:opacity-100 text-muted-foreground hover:text-foreground ml-1"
                      >
                        <Download className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-base font-bold text-foreground mb-1">Add Meeting to Calendar</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Scheduled for <span className="font-semibold text-primary">{selectedDay}</span>.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Product Architecture Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
