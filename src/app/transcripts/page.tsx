'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Meeting, TranscriptEntry } from '@/types';
import { useApp } from '@/context/AppContext';
import jsPDF from 'jspdf';

function TranscriptsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const { showToast } = useApp();

  const [query, setQuery] = useState(initialQ);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allTranscripts, setAllTranscripts] = useState<(TranscriptEntry & { meetingTitle: string })[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const data = await res.json();
          setMeetings(data.meetings || []);

          const aggregated: (TranscriptEntry & { meetingTitle: string })[] = [];
          for (const m of data.meetings || []) {
            const trRes = await fetch(`/api/meetings/${m.id}/transcript`);
            if (trRes.ok) {
              const trData = await trRes.json();
              (trData.transcripts || []).forEach((t: TranscriptEntry) => {
                aggregated.push({ ...t, meetingTitle: m.title });
              });
            }
          }
          setAllTranscripts(aggregated);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const speakers = Array.from(new Set(allTranscripts.map((t) => t.speakerName)));

  const filtered = allTranscripts.filter((t) => {
    if (selectedMeetingId && t.meetingId !== selectedMeetingId) return false;
    if (selectedSpeaker && t.speakerName !== selectedSpeaker) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        t.text.toLowerCase().includes(q) ||
        t.speakerName.toLowerCase().includes(q) ||
        t.meetingTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyLine = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Transcript line copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Search Transcripts Export', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Total results: ${filtered.length} matching utterances`, 14, 28);

      let yPos = 38;
      doc.setFontSize(10);

      filtered.slice(0, 40).forEach((t) => {
        doc.setTextColor(30, 64, 175);
        doc.text(`[${t.meetingTitle} | ${t.formattedTime}] ${t.speakerName}:`, 14, yPos);
        yPos += 5;

        doc.setTextColor(50);
        const splitText = doc.splitTextToSize(t.text, 180);
        doc.text(splitText, 14, yPos);
        yPos += splitText.length * 5 + 3;

        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });

      doc.save('Meeting_Transcripts_Export.pdf');
      showToast('Transcripts exported to PDF');
    } catch (e) {
      console.error(e);
      showToast('Error exporting PDF');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Searchable Transcripts</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Diarized Archive
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Instant full-text search across all spoken dialogue with speaker attribution and timestamps.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Search Results (PDF)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keywords, decisions, speakers, phrases across all meetings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
          >
            <option value="">All Meetings</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none"
          >
            <option value="">All Speakers</option>
            {speakers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcripts List */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border/60 bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Results: {filtered.length} spoken lines found</span>
        </div>

        <div className="divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No transcript matches found for &quot;{query}&quot;. Try a different keyword or filter.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-secondary/40 transition-colors flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-foreground">{t.speakerName}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-[11px] font-mono text-primary font-semibold">
                      {t.formattedTime}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <Link
                      href={`/ai-notes/${t.meetingId}`}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                    >
                      <span>{t.meetingTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed text-foreground/90">
                    {t.text}
                  </p>
                </div>

                <button
                  onClick={() => copyLine(t.id, t.text)}
                  className="p-1.5 rounded-lg border border-border/80 hover:bg-secondary text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy line"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function TranscriptsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-muted-foreground">Loading transcripts...</div>}>
      <TranscriptsContent />
    </Suspense>
  );
}
