'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Search,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react';
import { MeetingSummary, Meeting } from '@/types';

export default function AINotesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const data = await res.json();
          setMeetings(data.meetings || []);

          const loadedSummaries: MeetingSummary[] = [];
          for (const m of data.meetings || []) {
            const detailRes = await fetch(`/api/meetings/${m.id}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              if (detail.summary) {
                loadedSummaries.push(detail.summary);
              }
            }
          }
          setSummaries(loadedSummaries);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = summaries.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.overview.toLowerCase().includes(q) ||
      s.executiveSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Meeting Notes</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Notion Style
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Structured executive summaries, decisions, questions, and action items captured by your AI meeting assistant.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes, decisions, action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid of Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-card border border-border rounded-xl">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No meeting notes found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Complete a meeting in the platform or search with different keywords.
            </p>
          </div>
        ) : (
          filtered.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-xl bg-card border border-border/80 hover:border-blue-500/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    <Link href={`/ai-notes/${note.meetingId}`}>{note.title}</Link>
                  </h3>
                  <span className="text-[10px] uppercase font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    AI Report
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {note.executiveSummary}
                </p>

                {/* Key decisions pill */}
                {note.importantDecisions?.length > 0 && (
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/60 text-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                      Decision Made
                    </span>
                    <p className="text-foreground text-xs line-clamp-1">
                      {note.importantDecisions[0]}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {note.actionItems?.length || 0} action items
                </span>

                <Link
                  href={`/ai-notes/${note.meetingId}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
