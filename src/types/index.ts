export type UserRole = 'admin' | 'host' | 'member' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  workspaceId: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type MeetingStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface MeetingParticipant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  isHost?: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
  leftAt?: string;
  status: 'active' | 'waiting' | 'left' | 'rejected';
}

export interface Meeting {
  id: string;
  code: string; // e.g. "abc-defg-hij"
  title: string;
  description?: string;
  workspaceId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: MeetingStatus;
  waitingRoomEnabled: boolean;
  recordingEnabled: boolean;
  tags: string[];
  invitedEmails: string[];
  attendeesCount?: number;
  totalDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptEntry {
  id: string;
  meetingId: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number; // seconds from meeting start
  formattedTime: string; // "12:04"
  createdAt: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignedTo: string;
  assigneeName: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  title: string;
  overview: string;
  executiveSummary: string;
  keyPoints: string[];
  importantDecisions: string[];
  questionsRaised: string[];
  problemsChallenges: string[];
  actionItems: ActionItem[];
  unresolvedQuestions: string[];
  nextSteps: string[];
  highlights: string[];
  generatedAt: string;
}

export interface Task {
  id: string;
  meetingId?: string;
  meetingTitle?: string;
  title: string;
  description: string;
  assignedPerson: string;
  assignedPersonAvatar?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  isPrivate?: boolean;
  recipientId?: string;
}

export interface MeetingRecording {
  id: string;
  meetingId: string;
  meetingTitle: string;
  url: string; // Blob URL or stored data URL or server path
  durationSeconds: number;
  formattedDuration: string;
  fileSizeBytes: number;
  createdAt: string;
  transcriptCount: number;
}

export interface MeetingAttendanceReport {
  meetingId: string;
  meetingTitle: string;
  date: string;
  totalParticipants: number;
  averageDurationMinutes: number;
  attendees: {
    participantId: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
    leftAt: string;
    durationMinutes: number;
    speakingTimeSeconds: number;
  }[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    meetingId: string;
    meetingTitle: string;
    date: string;
    quote: string;
    timestamp?: string;
  }[];
}
