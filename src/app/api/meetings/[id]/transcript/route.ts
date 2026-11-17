import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { TranscriptEntry } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const idOrCode = params.id;
  const meeting = db.meetings.find((m) => m.id === idOrCode || m.code === idOrCode);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const entries = db.transcripts[meeting.id] || [];
  return NextResponse.json({ transcripts: entries });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const idOrCode = params.id;
    const meeting = db.meetings.find((m) => m.id === idOrCode || m.code === idOrCode);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const body = await req.json();
    const { speakerId, speakerName, text, timestamp } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!db.transcripts[meeting.id]) {
      db.transcripts[meeting.id] = [];
    }

    const seconds = timestamp || Math.floor((Date.now() - new Date(meeting.actualStartTime || meeting.createdAt).getTime()) / 1000);
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const newEntry: TranscriptEntry = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      meetingId: meeting.id,
      speakerId: speakerId || 'usr_1',
      speakerName: speakerName || 'Speaker',
      text: text.trim(),
      timestamp: Math.max(0, seconds),
      formattedTime,
      createdAt: new Date().toISOString(),
    };

    db.transcripts[meeting.id].push(newEntry);
    saveDb(db);

    return NextResponse.json({ entry: newEntry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
