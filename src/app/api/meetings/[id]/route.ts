import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const idOrCode = params.id;

  // Search by either id or code
  const meeting = db.meetings.find((m) => m.id === idOrCode || m.code === idOrCode);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const summary = db.summaries[meeting.id] || null;
  const transcripts = db.transcripts[meeting.id] || [];
  const chats = db.chats[meeting.id] || [];
  const recording = db.recordings.find((r) => r.meetingId === meeting.id) || null;
  const attendance = db.attendance[meeting.id] || null;

  return NextResponse.json({
    meeting,
    summary,
    transcripts,
    chats,
    recording,
    attendance,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const idOrCode = params.id;
    const meetingIndex = db.meetings.findIndex((m) => m.id === idOrCode || m.code === idOrCode);

    if (meetingIndex === -1) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const body = await req.json();
    const existing = db.meetings[meetingIndex];

    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    if (body.status === 'ended' && !existing.actualEndTime) {
      updated.actualEndTime = new Date().toISOString();
      if (existing.actualStartTime) {
        const diffMs = new Date(updated.actualEndTime).getTime() - new Date(existing.actualStartTime).getTime();
        updated.totalDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
      } else {
        updated.totalDurationMinutes = 15;
      }
    }

    db.meetings[meetingIndex] = updated;
    saveDb(db);

    return NextResponse.json({ meeting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const idOrCode = params.id;
  const meetingIndex = db.meetings.findIndex((m) => m.id === idOrCode || m.code === idOrCode);

  if (meetingIndex === -1) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const meeting = db.meetings[meetingIndex];
  db.meetings.splice(meetingIndex, 1);
  delete db.transcripts[meeting.id];
  delete db.summaries[meeting.id];
  delete db.chats[meeting.id];
  delete db.attendance[meeting.id];
  db.recordings = db.recordings.filter((r) => r.meetingId !== meeting.id);
  db.tasks = db.tasks.filter((t) => t.meetingId !== meeting.id);

  saveDb(db);
  return NextResponse.json({ success: true });
}
