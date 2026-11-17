export interface PeerSignalMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  targetId?: string; // If targeting specific peer, or broadcast if undefined
  type: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'chat' | 'reaction' | 'hand-raise' | 'mute-request' | 'waiting-approve';
  payload: any;
  timestamp: number;
}

// In-memory store for signaling events (accessible within the Node process)
// For multi-tenant or serverless reload resilience, store messages with TTL
class SignalingServer {
  private rooms: Map<string, PeerSignalMessage[]> = new Map();
  private participants: Map<string, Map<string, { id: string; name: string; joinedAt: number; role: string; handRaised?: boolean }>> = new Map();

  constructor() {
    // Periodic cleanup of messages older than 2 minutes
    setInterval(() => {
      const now = Date.now();
      this.rooms.forEach((messages, roomId) => {
        const fresh = messages.filter((m) => now - m.timestamp < 120000);
        this.rooms.set(roomId, fresh);
      });
    }, 60000);
  }

  joinRoom(roomId: string, participant: { id: string; name: string; role: string }) {
    if (!this.participants.has(roomId)) {
      this.participants.set(roomId, new Map());
    }
    const roomParts = this.participants.get(roomId)!;
    roomParts.set(participant.id, { ...participant, joinedAt: Date.now() });

    this.postMessage({
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      roomId,
      senderId: participant.id,
      senderName: participant.name,
      type: 'join',
      payload: { role: participant.role },
      timestamp: Date.now(),
    });

    return Array.from(roomParts.values());
  }

  leaveRoom(roomId: string, participantId: string, participantName: string) {
    const roomParts = this.participants.get(roomId);
    if (roomParts) {
      roomParts.delete(participantId);
    }
    this.postMessage({
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      roomId,
      senderId: participantId,
      senderName: participantName,
      type: 'leave',
      payload: {},
      timestamp: Date.now(),
    });
  }

  getParticipants(roomId: string) {
    const roomParts = this.participants.get(roomId);
    return roomParts ? Array.from(roomParts.values()) : [];
  }

  postMessage(message: PeerSignalMessage) {
    if (!this.rooms.has(message.roomId)) {
      this.rooms.set(message.roomId, []);
    }
    const list = this.rooms.get(message.roomId)!;
    list.push(message);
    if (list.length > 500) {
      list.shift();
    }
  }

  getMessagesSince(roomId: string, sinceTimestamp: number, participantId: string): PeerSignalMessage[] {
    const list = this.rooms.get(roomId) || [];
    return list.filter((m) => {
      // Must be newer than sinceTimestamp
      if (m.timestamp <= sinceTimestamp) return false;
      // Filter out messages sent by the requester themselves
      if (m.senderId === participantId) return false;
      // Filter out messages targeted to someone else
      if (m.targetId && m.targetId !== participantId) return false;
      return true;
    });
  }
}

// Global singleton across hot-reloads
const globalSignaling = globalThis as unknown as { __signalingServer?: SignalingServer };
export const signalingServer = globalSignaling.__signalingServer || new SignalingServer();
globalSignaling.__signalingServer = signalingServer;
