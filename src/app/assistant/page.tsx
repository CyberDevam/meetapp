'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Trash2,
  Video,
  Clock,
  ExternalLink,
  Bot,
  User,
  Quote,
  Mail,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { AIChatMessage, Meeting } from '@/types';
import { useApp } from '@/context/AppContext';

export default function AssistantPage() {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [chatRes, mtgRes] = await Promise.all([
          fetch('/api/ai/chat'),
          fetch('/api/meetings'),
        ]);

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setMessages(chatData.messages || []);
        }

        if (mtgRes.ok) {
          const mtgData = await mtgRes.json();
          setMeetings(mtgData.meetings || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || isSubmitting) return;

    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q.trim(),
          meetingFilterId: selectedMeetingId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.history || [...messages, userMsg, data.message]);
      } else {
        showToast('Error querying meeting intelligence');
      }
    } catch (e) {
      console.error(e);
      showToast('AI Query failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear AI conversation history?')) return;
    try {
      await fetch('/api/ai/chat', { method: 'DELETE' });
      setMessages([]);
      showToast('Conversation cleared');
    } catch (e) {
      console.error(e);
    }
  };

  const samplePrompts = [
    'What did Sarah say about transcription latency?',
    'What decisions were made regarding WebRTC audio tracks?',
    'What tasks are currently pending for David Kim?',
    'Draft a follow-up email for the Q4 Product Roadmap sync',
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground">
              Meeting AI Assistant
            </h1>
            <span className="text-[10px] text-muted-foreground block">
              Ask questions across all indexed transcripts and summaries
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scope Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Scope:</span>
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="px-2.5 py-1 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Authorized Meetings</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            title="Clear Chat"
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread (ChatGPT style) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                How can I help with your meeting archives?
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                I can summarize previous discussions, find forgotten commitments, draft emails, and quote timestamps from your meeting transcripts.
              </p>
            </div>

            {/* Prompt suggestions pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto pt-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="p-3 text-left rounded-xl border border-border/80 bg-card hover:bg-secondary hover:border-border transition-all text-xs text-foreground/90 font-medium group flex items-start justify-between"
                >
                  <span>{p}</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl space-y-3 rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                      : 'bg-card border border-border/80 text-foreground rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citations block if assistant provided them */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Quote className="w-3 h-3 text-blue-400" />
                        <span>Sources & Citations</span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.citations.map((c, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-secondary/50 border border-border/50 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between font-semibold text-blue-400">
                              <span>{c.meetingTitle}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {c.timestamp ? `Timestamp: ${c.timestamp}` : c.date}
                              </span>
                            </div>
                            <p className="text-muted-foreground italic">&ldquo;{c.quote}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-right opacity-60 pt-0.5">{msg.timestamp}</div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground flex-shrink-0 font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSubmitting && (
          <div className="flex gap-3 items-center text-xs text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Searching meeting transcripts and reasoning...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-border bg-card/60 backdrop-blur-md flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about previous meetings, transcripts, decisions, or action items..."
            className="flex-1 px-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isSubmitting}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
