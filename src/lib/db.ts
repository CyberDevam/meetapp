import fs from 'fs';
import path from 'path';
import {
  UserProfile,
  Workspace,
  Meeting,
  TranscriptEntry,
  MeetingSummary,
  Task,
  ChatMessage,
  MeetingRecording,
  MeetingAttendanceReport,
  AIChatMessage,
} from '@/types';

export interface DatabaseSchema {
  users: UserProfile[];
  workspaces: Workspace[];
  meetings: Meeting[];
  transcripts: Record<string, TranscriptEntry[]>; // meetingId -> entries
  summaries: Record<string, MeetingSummary>; // meetingId -> summary
  tasks: Task[];
  chats: Record<string, ChatMessage[]>; // meetingId -> messages
  recordings: MeetingRecording[];
  attendance: Record<string, MeetingAttendanceReport>;
  aiChatHistory: AIChatMessage[];
  settings: {
    openaiApiKey?: string;
    geminiApiKey?: string;
    livekitUrl?: string;
    livekitApiKey?: string;
    livekitApiSecret?: string;
    activeWorkspaceId: string;
    currentUserId: string;
  };
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data for a rich, out-of-the-box experience
const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'usr_1',
      name: 'Alex Rivera',
      email: 'alex.rivera@meetai.io',
      role: 'admin',
      workspaceId: 'ws_default',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr_2',
      name: 'Sarah Chen',
      email: 'sarah.chen@meetai.io',
      role: 'host',
      workspaceId: 'ws_default',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'usr_3',
      name: 'David Kim',
      email: 'david.kim@meetai.io',
      role: 'member',
      workspaceId: 'ws_default',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'usr_4',
      name: 'Elena Rostova',
      email: 'elena.rostova@acme.com',
      role: 'guest',
      workspaceId: 'ws_default',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  workspaces: [
    {
      id: 'ws_default',
      name: 'Acme Product & Engineering',
      slug: 'acme-product',
      ownerId: 'usr_1',
      members: [
        { userId: 'usr_1', name: 'Alex Rivera', email: 'alex.rivera@meetai.io', role: 'admin' },
        { userId: 'usr_2', name: 'Sarah Chen', email: 'sarah.chen@meetai.io', role: 'host' },
        { userId: 'usr_3', name: 'David Kim', email: 'david.kim@meetai.io', role: 'member' },
        { userId: 'usr_4', name: 'Elena Rostova', email: 'elena.rostova@acme.com', role: 'guest' },
      ],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'ws_growth',
      name: 'Growth & Marketing HQ',
      slug: 'growth-marketing',
      ownerId: 'usr_1',
      members: [
        { userId: 'usr_1', name: 'Alex Rivera', email: 'alex.rivera@meetai.io', role: 'admin' },
        { userId: 'usr_2', name: 'Sarah Chen', email: 'sarah.chen@meetai.io', role: 'member' },
      ],
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ],
  meetings: [
    {
      id: 'mtg_q4_sync',
      code: 'q4-plan-syn',
      title: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      description: 'Strategic review of AI latency optimizations, WebRTC SFU scaling, and Q4 customer deliverables.',
      workspaceId: 'ws_default',
      hostId: 'usr_1',
      hostName: 'Alex Rivera',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      scheduledStartTime: new Date(Date.now() - 86400000 * 2).toISOString(),
      scheduledEndTime: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      actualStartTime: new Date(Date.now() - 86400000 * 2).toISOString(),
      actualEndTime: new Date(Date.now() - 86400000 * 2 + 3420000).toISOString(),
      status: 'ended',
      waitingRoomEnabled: true,
      recordingEnabled: true,
      tags: ['Strategy', 'AI', 'Roadmap'],
      invitedEmails: ['alex.rivera@meetai.io', 'sarah.chen@meetai.io', 'david.kim@meetai.io'],
      attendeesCount: 3,
      totalDurationMinutes: 57,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mtg_arch_review',
      code: 'arch-sec-rev',
      title: 'Real-Time Audio Diarization & Pipeline Architecture',
      description: 'Reviewing Whisper live streaming pipelines, WebRTC audio buffers, and speaker segmentation accuracy.',
      workspaceId: 'ws_default',
      hostId: 'usr_2',
      hostName: 'Sarah Chen',
      hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      scheduledStartTime: new Date(Date.now() - 86400000).toISOString(),
      scheduledEndTime: new Date(Date.now() - 86400000 + 2700000).toISOString(),
      actualStartTime: new Date(Date.now() - 86400000).toISOString(),
      actualEndTime: new Date(Date.now() - 86400000 + 2640000).toISOString(),
      status: 'ended',
      waitingRoomEnabled: false,
      recordingEnabled: true,
      tags: ['Engineering', 'Audio', 'Whisper'],
      invitedEmails: ['sarah.chen@meetai.io', 'david.kim@meetai.io'],
      attendeesCount: 2,
      totalDurationMinutes: 44,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'mtg_today_standup',
      code: 'daily-eng-up',
      title: 'Daily AI Engineering Standup',
      description: 'Daily team sync on tasks, blockers, and AI summary improvements.',
      workspaceId: 'ws_default',
      hostId: 'usr_1',
      hostName: 'Alex Rivera',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      scheduledStartTime: new Date(Date.now() + 3600000).toISOString(),
      scheduledEndTime: new Date(Date.now() + 5400000).toISOString(),
      status: 'scheduled',
      waitingRoomEnabled: true,
      recordingEnabled: true,
      tags: ['Standup', 'Daily'],
      invitedEmails: ['alex.rivera@meetai.io', 'sarah.chen@meetai.io', 'david.kim@meetai.io', 'elena.rostova@acme.com'],
      attendeesCount: 4,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  transcripts: {
    mtg_q4_sync: [
      {
        id: 'tr_1',
        meetingId: 'mtg_q4_sync',
        speakerId: 'usr_1',
        speakerName: 'Alex Rivera',
        text: 'Welcome everyone to our Q4 roadmap sync. Today our main agenda is finalizing the AI assistant integration and WebRTC video latency.',
        timestamp: 12,
        formattedTime: '00:12',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_2',
        meetingId: 'mtg_q4_sync',
        speakerId: 'usr_2',
        speakerName: 'Sarah Chen',
        text: 'Thanks Alex. On the speech-to-text pipeline, we tested streaming chunks every 3 seconds to Whisper. We managed to get transcription latency down from 4.2 seconds to 650 milliseconds.',
        timestamp: 35,
        formattedTime: '00:35',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_3',
        meetingId: 'mtg_q4_sync',
        speakerId: 'usr_3',
        speakerName: 'David Kim',
        text: 'That is huge! For the database side, we have indexed transcripts by meeting ID and timestamp so users can search across thousands of meetings instantaneously.',
        timestamp: 78,
        formattedTime: '01:18',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_4',
        meetingId: 'mtg_q4_sync',
        speakerId: 'usr_1',
        speakerName: 'Alex Rivera',
        text: 'Great progress. Can we ensure the action items extracted by the AI directly sync into our task management system with assignees and due dates?',
        timestamp: 110,
        formattedTime: '01:50',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_5',
        meetingId: 'mtg_q4_sync',
        speakerId: 'usr_2',
        speakerName: 'Sarah Chen',
        text: 'Yes! The prompt will return structured JSON with title, priority, assignee email, and due date. I will have that endpoint completed by Friday.',
        timestamp: 135,
        formattedTime: '02:15',
        createdAt: new Date().toISOString(),
      },
    ],
    mtg_arch_review: [
      {
        id: 'tr_6',
        meetingId: 'mtg_arch_review',
        speakerId: 'usr_2',
        speakerName: 'Sarah Chen',
        text: 'Let us examine speaker diarization. We want to distinguish between host and guests accurately without manual tagging.',
        timestamp: 15,
        formattedTime: '00:15',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_7',
        meetingId: 'mtg_arch_review',
        speakerId: 'usr_3',
        speakerName: 'David Kim',
        text: 'Since each participant streams an individual WebRTC audio track, we know the exact participant ID associated with each audio stream at the browser source!',
        timestamp: 42,
        formattedTime: '00:42',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tr_8',
        meetingId: 'mtg_arch_review',
        speakerId: 'usr_2',
        speakerName: 'Sarah Chen',
        text: 'That simplifies the architecture dramatically. Let us lock that decision in: browser-side audio stream tagging paired with cloud LLM post-processing.',
        timestamp: 88,
        formattedTime: '01:28',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  summaries: {
    mtg_q4_sync: {
      id: 'sum_1',
      meetingId: 'mtg_q4_sync',
      title: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      overview: 'The team reviewed real-time speech transcription benchmarks, database indexing strategies, and automated action item synchronization.',
      executiveSummary: 'Sarah demonstrated an 84% reduction in transcription latency (down to 650ms). David confirmed the transcript indexing layer is complete. The team approved direct automatic conversion of meeting action items into the Linear-style task board.',
      keyPoints: [
        'Whisper streaming latency decreased from 4.2s to 650ms by utilizing 3-second audio slices.',
        'Transcript full-text search and vector indexing now supports cross-meeting semantic query retrieval.',
        'Action item extraction returns structured JSON including priority, deadline, and assignee matching.',
      ],
      importantDecisions: [
        'Approved adoption of 3-second chunk streaming for live meeting captions.',
        'Standardized on Linear-style task model for AI-generated action items.',
        'Scheduled public beta launch of AI Assistant for November 28.',
      ],
      questionsRaised: [
        'How will the system handle intermittent microphone dropouts during transcription?',
        'Can guests outside the organization view restricted meeting summaries?',
      ],
      problemsChallenges: [
        'High concurrency cloud GPU costs during peak office hours.',
        'Handling audio echo cancellation when multiple users join in the same conference room.',
      ],
      actionItems: [
        {
          id: 'act_1',
          text: 'Complete structured JSON action item parsing endpoint',
          assignedTo: 'usr_2',
          assigneeName: 'Sarah Chen',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          priority: 'high',
          completed: false,
        },
        {
          id: 'act_2',
          text: 'Benchmark vector database search response time under 100k meeting load',
          assignedTo: 'usr_3',
          assigneeName: 'David Kim',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          priority: 'medium',
          completed: false,
        },
        {
          id: 'act_3',
          text: 'Finalize client-side recording and WebM export pipeline',
          assignedTo: 'usr_1',
          assigneeName: 'Alex Rivera',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          priority: 'urgent',
          completed: true,
        },
      ],
      unresolvedQuestions: [
        'Whether to offer local offline Whisper processing via WebAssembly for sensitive enterprise customers.',
      ],
      nextSteps: [
        'Conduct end-to-end load test on Thursday at 2:00 PM EST.',
        'Prepare enterprise privacy documentation and audit log specification.',
      ],
      highlights: [
        'Transcription latency sub-second milestone achieved.',
        'One-click task sync integration accepted by engineering leads.',
      ],
      generatedAt: new Date(Date.now() - 86400000 * 2 + 3700000).toISOString(),
    },
    mtg_arch_review: {
      id: 'sum_2',
      meetingId: 'mtg_arch_review',
      title: 'Real-Time Audio Diarization & Pipeline Architecture',
      overview: 'Focused on optimizing participant speaker identification by leveraging individual WebRTC peer track metadata.',
      executiveSummary: 'David and Sarah agreed to bypass complex post-hoc acoustic diarization by tagging audio packets at the WebRTC track level, resulting in 100% accurate speaker attribution.',
      keyPoints: [
        'Individual WebRTC peer tracks natively carry participant identification.',
        'Eliminates acoustic overlap errors that occur in single-channel conference recordings.',
      ],
      importantDecisions: [
        'Adopt track-level client speaker tagging for all multi-party calls.',
      ],
      questionsRaised: [
        'Does screen share system audio interfere with mic speaker tracks?',
      ],
      problemsChallenges: [
        'Safari WebRTC audio track isolation variations on older iOS versions.',
      ],
      actionItems: [
        {
          id: 'act_4',
          text: 'Document WebRTC audio track tagging protocol in engineering docs',
          assignedTo: 'usr_3',
          assigneeName: 'David Kim',
          dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
          priority: 'medium',
          completed: false,
        },
      ],
      unresolvedQuestions: [],
      nextSteps: [
        'Implement prototype in Next.js WebRTC hook.',
      ],
      highlights: [
        'Zero-overhead diarization approach accepted.',
      ],
      generatedAt: new Date(Date.now() - 86400000 + 2700000).toISOString(),
    },
  },
  tasks: [
    {
      id: 'tsk_1',
      meetingId: 'mtg_q4_sync',
      meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      title: 'Complete structured JSON action item parsing endpoint',
      description: 'Implement AI parsing service that takes transcript entries and extracts validated action items with due dates and assignees.',
      assignedPerson: 'Sarah Chen',
      assignedPersonAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tsk_2',
      meetingId: 'mtg_q4_sync',
      meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      title: 'Benchmark vector database search response time under 100k meeting load',
      description: 'Simulate 100k transcripts and evaluate RAG embedding retrieval latency with pgvector / SQLite embeddings.',
      assignedPerson: 'David Kim',
      assignedPersonAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tsk_3',
      meetingId: 'mtg_q4_sync',
      meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      title: 'Finalize client-side recording and WebM export pipeline',
      description: 'Ensure MediaRecorder cleanly captures canvas mix, screen share, and mic audio with seeking timestamp support.',
      assignedPerson: 'Alex Rivera',
      assignedPersonAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tsk_4',
      meetingId: 'mtg_arch_review',
      meetingTitle: 'Real-Time Audio Diarization & Pipeline Architecture',
      title: 'Document WebRTC audio track tagging protocol in engineering docs',
      description: 'Write RFC detailing the browser-side participant track ID correlation with live transcription streams.',
      assignedPerson: 'David Kim',
      assignedPersonAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  chats: {
    mtg_q4_sync: [
      {
        id: 'c1',
        meetingId: 'mtg_q4_sync',
        senderId: 'usr_2',
        senderName: 'Sarah Chen',
        message: 'Shared the latency benchmark slides in Slack #product channel.',
        timestamp: '10:04 AM',
      },
      {
        id: 'c2',
        meetingId: 'mtg_q4_sync',
        senderId: 'usr_3',
        senderName: 'David Kim',
        message: 'Looking at them now, impressive speedup!',
        timestamp: '10:05 AM',
      },
    ],
  },
  recordings: [
    {
      id: 'rec_1',
      meetingId: 'mtg_q4_sync',
      meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationSeconds: 3420,
      formattedDuration: '57:00',
      fileSizeBytes: 142000000,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      transcriptCount: 5,
    },
    {
      id: 'rec_2',
      meetingId: 'mtg_arch_review',
      meetingTitle: 'Real-Time Audio Diarization & Pipeline Architecture',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationSeconds: 2640,
      formattedDuration: '44:00',
      fileSizeBytes: 98000000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      transcriptCount: 3,
    },
  ],
  attendance: {
    mtg_q4_sync: {
      meetingId: 'mtg_q4_sync',
      meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      totalParticipants: 3,
      averageDurationMinutes: 56,
      attendees: [
        {
          participantId: 'usr_1',
          name: 'Alex Rivera',
          email: 'alex.rivera@meetai.io',
          role: 'Host',
          joinedAt: '10:00 AM',
          leftAt: '10:57 AM',
          durationMinutes: 57,
          speakingTimeSeconds: 1120,
        },
        {
          participantId: 'usr_2',
          name: 'Sarah Chen',
          email: 'sarah.chen@meetai.io',
          role: 'Member',
          joinedAt: '10:01 AM',
          leftAt: '10:57 AM',
          durationMinutes: 56,
          speakingTimeSeconds: 980,
        },
        {
          participantId: 'usr_3',
          name: 'David Kim',
          email: 'david.kim@meetai.io',
          role: 'Member',
          joinedAt: '10:02 AM',
          leftAt: '10:56 AM',
          durationMinutes: 54,
          speakingTimeSeconds: 740,
        },
      ],
    },
  },
  aiChatHistory: [
    {
      id: 'msg_1',
      role: 'user',
      content: 'What did Sarah say about the transcription latency in our Q4 roadmap sync?',
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: 'In the **Q4 Product Roadmap & AI Infrastructure Strategy** meeting, Sarah Chen reported that by streaming audio in 3-second chunks to Whisper, the team reduced transcription latency from **4.2 seconds down to 650 milliseconds** (an 84% improvement).',
      timestamp: new Date(Date.now() - 3600000 * 4 + 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        {
          meetingId: 'mtg_q4_sync',
          meetingTitle: 'Q4 Product Roadmap & AI Infrastructure Strategy',
          date: '2 days ago',
          timestamp: '00:35',
          quote: 'We tested streaming chunks every 3 seconds to Whisper. We managed to get transcription latency down from 4.2 seconds to 650 milliseconds.',
        },
      ],
    },
  ],
  settings: {
    activeWorkspaceId: 'ws_default',
    currentUserId: 'usr_1',
  },
};

function ensureDbFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

export function getDb(): DatabaseSchema {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return defaultDb;
  }
}

export function saveDb(data: DatabaseSchema): void {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
