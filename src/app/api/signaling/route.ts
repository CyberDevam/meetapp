import { NextRequest, NextResponse } from 'next/server';
import { signalingServer, PeerSignalMessage } from '@/lib/signaling';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId, participantId, participantName, role, message, sinceTimestamp } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    if (action === 'join') {
      const participants = signalingServer.joinRoom(roomId, {
        id: participantId,
        name: participantName || 'Guest User',
        role: role || 'member',
      });
      return NextResponse.json({ success: true, participants });
    }

    if (action === 'leave') {
      signalingServer.leaveRoom(roomId, participantId, participantName);
      return NextResponse.json({ success: true });
    }

    if (action === 'send') {
      const signalMsg: PeerSignalMessage = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        roomId,
        senderId: participantId,
        senderName: participantName || 'User',
        targetId: message.targetId,
        type: message.type,
        payload: message.payload,
        timestamp: Date.now(),
      };
      signalingServer.postMessage(signalMsg);
      return NextResponse.json({ success: true, messageId: signalMsg.id });
    }

    if (action === 'poll') {
      const messages = signalingServer.getMessagesSince(roomId, sinceTimestamp || 0, participantId);
      const participants = signalingServer.getParticipants(roomId);
      return NextResponse.json({ messages, participants, serverTime: Date.now() });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
