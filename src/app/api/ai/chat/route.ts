import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { askMeetingHistoryAI } from '@/lib/ai';
import { AIChatMessage } from '@/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ messages: db.aiChatHistory || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, meetingFilterId } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const db = getDb();

    // Record user message
    const userMsg: AIChatMessage = {
      id: `usr_msg_${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (!db.aiChatHistory) {
      db.aiChatHistory = [];
    }
    db.aiChatHistory.push(userMsg);

    // Call RAG AI Search
    const aiResult = await askMeetingHistoryAI(query, meetingFilterId);

    const assistantMsg: AIChatMessage = {
      id: `ai_msg_${Date.now()}`,
      role: 'assistant',
      content: aiResult.answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: aiResult.citations,
    };

    db.aiChatHistory.push(assistantMsg);

    saveDb(db);

    return NextResponse.json({
      message: assistantMsg,
      history: db.aiChatHistory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const db = getDb();
  db.aiChatHistory = [];
  saveDb(db);
  return NextResponse.json({ success: true });
}
