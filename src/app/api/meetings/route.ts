import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Meeting } from '@/types';

function generateMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const workspaceId = searchParams.get('workspaceId') || db.settings.activeWorkspaceId;

  let meetings = db.meetings.filter((m) => m.workspaceId === workspaceId || !m.workspaceId);

  if (status) {
    meetings = meetings.filter((m) => m.status === status);
  }

  // Sort: live first, then upcoming scheduled, then recently ended
  meetings.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime());

  return NextResponse.json({ meetings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const currentUser = db.users.find((u) => u.id === db.settings.currentUserId) || db.users[0];

    const isInstant = body.isInstant === true;
    const now = new Date();
    const scheduledStart = body.scheduledStartTime ? new Date(body.scheduledStartTime) : now;
    const scheduledEnd = body.scheduledEndTime
      ? new Date(body.scheduledEndTime)
      : new Date(scheduledStart.getTime() + 60 * 60 * 1000);

    const newMeeting: Meeting = {
      id: `mtg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      code: generateMeetingCode(),
      title: body.title?.trim() || (isInstant ? `Instant Meeting (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'Untitled Meeting'),
      description: body.description || '',
      workspaceId: body.workspaceId || db.settings.activeWorkspaceId,
      hostId: currentUser.id,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatarUrl,
      scheduledStartTime: scheduledStart.toISOString(),
      scheduledEndTime: scheduledEnd.toISOString(),
      actualStartTime: isInstant ? now.toISOString() : undefined,
      status: isInstant ? 'live' : 'scheduled',
      waitingRoomEnabled: body.waitingRoomEnabled ?? false,
      recordingEnabled: body.recordingEnabled ?? true,
      tags: body.tags || (isInstant ? ['Instant'] : ['General']),
      invitedEmails: body.invitedEmails || [],
      attendeesCount: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    db.meetings.unshift(newMeeting);
    saveDb(db);

    return NextResponse.json({ meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
