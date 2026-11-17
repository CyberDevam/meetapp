import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { MeetingRecording } from '@/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const meetingId = searchParams.get('meetingId');

  let recordings = [...db.recordings];
  if (meetingId) {
    recordings = recordings.filter((r) => r.meetingId === meetingId);
  }

  recordings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ recordings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const { meetingId, durationSeconds, url, fileSizeBytes } = body;

    const meeting = db.meetings.find((m) => m.id === meetingId || m.code === meetingId);
    const meetingTitle = meeting ? meeting.title : 'Recorded Meeting Session';

    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const newRec: MeetingRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      meetingId: meeting?.id || meetingId,
      meetingTitle,
      url: url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationSeconds,
      formattedDuration,
      fileSizeBytes: fileSizeBytes || Math.round(durationSeconds * 250000), // ~250KB/sec average
      createdAt: new Date().toISOString(),
      transcriptCount: db.transcripts[meeting?.id || meetingId]?.length || 0,
    };

    db.recordings.unshift(newRec);
    saveDb(db);

    return NextResponse.json({ recording: newRec });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
