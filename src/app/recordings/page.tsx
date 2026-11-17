'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Download,
  Clock,
  Calendar,
  FileText,
  Volume2,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MeetingRecording, TranscriptEntry } from '@/types';
import { useApp } from '@/context/AppContext';
import jsPDF from 'jspdf';

export default function RecordingsPage() {
  const { showToast } = useApp();
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [selectedRec, setSelectedRec] = useState<MeetingRecording | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function loadRecordings() {
      try {
        setLoading(true);
        const res = await fetch('/api/recordings');
        if (res.ok) {
          const data = await res.json();
          setRecordings(data.recordings || []);
          if (data.recordings?.length > 0) {
            handleSelectRecording(data.recordings[0]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRecordings();
  }, []);

  const handleSelectRecording = async (rec: MeetingRecording) => {
    setSelectedRec(rec);
    try {
      const res = await fetch(`/api/meetings/${rec.meetingId}/transcript`);
      if (res.ok) {
        const data = await res.json();
        setTranscripts(data.transcripts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const jumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
      showToast(`Jumped to timestamp ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    }
  };

  const downloadRecordingFile = (rec: MeetingRecording) => {
    const a = document.createElement('a');
    a.href = rec.url;
    a.download = `${rec.meetingTitle.replace(/\s+/g, '_')}_recording.mp4`;
    a.target = '_blank';
    a.click();
    showToast('Download started for recording file');
  };

  const downloadTranscriptPDF = () => {
    if (!selectedRec || transcripts.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Transcript: ${selectedRec.meetingTitle}`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Duration: ${selectedRec.formattedDuration} | Recorded on ${new Date(selectedRec.createdAt).toLocaleDateString()}`, 14, 28);

      let yPos = 40;
      doc.setFontSize(10);

      transcripts.forEach((t) => {
        doc.setTextColor(30, 64, 175);
        doc.text(`[${t.formattedTime}] ${t.speakerName}:`, 14, yPos);
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

      doc.save(`${selectedRec.meetingTitle.replace(/\s+/g, '_')}_Transcript.pdf`);
      showToast('Transcript PDF downloaded!');
    } catch (e) {
      console.error(e);
      showToast('Error generating transcript PDF');
    }
  };

  const downloadTranscriptTXT = () => {
    if (!selectedRec || transcripts.length === 0) return;
    const txt = transcripts
      .map((t) => `[${t.formattedTime}] ${t.speakerName}: ${t.text}`)
      .join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRec.meetingTitle.replace(/\s+/g, '_')}_transcript.txt`;
    a.click();
    showToast('Transcript TXT downloaded!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Recordings & Transcripts</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              Interactive Sync
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click any transcript line to jump video playback directly to that moment.
          </p>
        </div>

        {selectedRec && (
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTranscriptTXT}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transcript (.TXT)</span>
            </button>
            <button
              onClick={downloadTranscriptPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Transcript (.PDF)</span>
            </button>
            <button
              onClick={() => downloadRecordingFile(selectedRec)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Video Player on Left, Synchronized Transcript on Right */}
      {selectedRec ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-border/80 shadow-2xl relative aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src={selectedRec.url}
                controls
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">{selectedRec.meetingTitle}</h2>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {selectedRec.formattedDuration}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedRec.createdAt).toLocaleDateString()}
                </span>
                <span>Size: ~{Math.round(selectedRec.fileSizeBytes / (1024 * 1024))} MB</span>
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Indexed with speaker diarization
                </span>
              </div>
            </div>

            {/* List of other recordings */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                All Available Recordings ({recordings.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recordings.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handleSelectRecording(rec)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      selectedRec.id === rec.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/80 bg-card hover:bg-secondary/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-foreground truncate">
                        {rec.meetingTitle}
                      </h4>
                      <span className="text-[10px] text-muted-foreground block">
                        {rec.formattedDuration} • {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Synchronized Transcript Timeline */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Synchronized Transcript</h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {transcripts.length} lines
              </span>
            </div>

            <div className="flex-1 max-h-[640px] overflow-y-auto rounded-xl border border-border/80 bg-card p-3 space-y-2">
              {transcripts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No transcripts recorded for this session.
                </div>
              ) : (
                transcripts.map((t) => {
                  const isActive =
                    currentTime >= t.timestamp &&
                    currentTime < (t.timestamp + 15);

                  return (
                    <div
                      key={t.id}
                      onClick={() => jumpToTimestamp(t.timestamp)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 ring-1 ring-blue-500/20'
                          : 'bg-secondary/30 border-transparent hover:bg-secondary/60 hover:border-border/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                          {t.speakerName}
                        </span>
                        <span className="font-mono text-[10px] text-primary font-bold hover:underline">
                          {t.formattedTime}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed hover:text-foreground">
                        {t.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-card border border-border rounded-xl">
          <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">No recordings available</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Start a meeting and click &quot;Record&quot; to capture your video and audio streams.
          </p>
        </div>
      )}
    </div>
  );
}
