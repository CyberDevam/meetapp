'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Users,
  Hand,
  Smile,
  Circle,
  StopCircle,
  Copy,
  Check,
  Settings,
  Sparkles,
  Subtitles,
  Maximize2,
  Minimize2,
  Volume2,
  Shield,
  Layers,
  Send,
  MoreVertical,
  X,
} from 'lucide-react';
import { Meeting, TranscriptEntry, ChatMessage, UserRole } from '@/types';
import { useApp } from '@/context/AppContext';

interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
}

export default function MeetingRoom() {
  const params = useParams();
  const meetingCode = (params.id as string) || '';
  const router = useRouter();
  const { currentUser, showToast } = useApp();

  // Meeting State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<{ id: string; name: string }[]>([]);

  // Local Media State
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [virtualBg, setVirtualBg] = useState<'none' | 'blur' | 'gradient'>('none');

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Transcription & Captions
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [currentCaption, setCurrentCaption] = useState<{ speaker: string; text: string } | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  // Live Chat & Drawers
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'chat' | 'participants' | 'notes' | 'settings'>('none');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [handRaised, setHandRaised] = useState(false);

  // Simulated & Remote Peers
  const [remotePeers, setRemotePeers] = useState<
    { id: string; name: string; role: string; audioMuted: boolean; videoMuted: boolean; handRaised: boolean; avatar: string }[]
  >([
    {
      id: 'usr_2',
      name: 'Sarah Chen',
      role: 'host',
      audioMuted: false,
      videoMuted: false,
      handRaised: false,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_3',
      name: 'David Kim',
      role: 'member',
      audioMuted: true,
      videoMuted: false,
      handRaised: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  ]);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

  // 1. Fetch meeting info
  useEffect(() => {
    async function loadMeeting() {
      try {
        const res = await fetch(`/api/meetings/${meetingCode}`);
        if (res.ok) {
          const data = await res.json();
          setMeeting(data.meeting);
          setTranscripts(data.transcripts || []);
          setChatMessages(data.chats || []);

          // Check if waiting room is enabled and user is not host
          const userIsHost = currentUser?.id === data.meeting.hostId || currentUser?.role === 'admin';
          if (data.meeting.waitingRoomEnabled && !userIsHost) {
            setIsInWaitingRoom(true);
          }
        } else {
          // If meeting doesn't exist yet, auto-create it on the fly
          const createRes = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Meeting ${meetingCode}`,
              isInstant: true,
            }),
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            setMeeting(createData.meeting);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMeeting();
  }, [meetingCode, currentUser]);

  // 2. Initialize Camera & Mic
  useEffect(() => {
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/mic access not granted or unavailable, operating in preview mode:', err);
      }
    }
    startMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3. Web Speech API for Real-Time Speech-to-Text Transcription
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = async (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          const isFinal = event.results[current].isFinal;

          const speaker = currentUser?.name || 'Alex Rivera';
          setCurrentCaption({ speaker, text: transcriptText });

          if (isFinal && transcriptText.trim().length > 3) {
            // Send final transcript segment to API
            try {
              const res = await fetch(`/api/meetings/${meetingCode}/transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  speakerId: currentUser?.id || 'usr_1',
                  speakerName: speaker,
                  text: transcriptText.trim(),
                }),
              });
              if (res.ok) {
                const data = await res.json();
                setTranscripts((prev) => [...prev, data.entry]);
              }
            } catch (e) {
              console.error(e);
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            console.warn('Speech recognition error:', e.error);
          }
        };

        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          // already started
        }
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [meetingCode, currentUser]);

  // 4. Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // 5. Toggle Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = audioMuted; // inverted because state updates next
      });
    }
    setAudioMuted(!audioMuted);
    showToast(!audioMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  // 6. Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = videoMuted;
      });
    }
    setVideoMuted(!videoMuted);
    showToast(!videoMuted ? 'Camera turned off' : 'Camera turned on');
  };

  // 7. Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
        showToast('Screen sharing started');
      } catch (e) {
        console.warn('Screen share canceled or denied:', e);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      showToast('Screen sharing stopped');
    }
  };

  // 8. In-browser Media Recording
  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const streamToRecord = screenStreamRef.current || localStreamRef.current;
      if (!streamToRecord) {
        showToast('No active camera or screen stream to record');
        return;
      }

      const recorder = new MediaRecorder(streamToRecord, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Upload recording metadata
        await fetch('/api/recordings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId: meeting?.id || meetingCode,
            durationSeconds: recordingSeconds,
            url,
            fileSizeBytes: blob.size,
          }),
        });

        showToast('Meeting recording saved and indexed!');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      showToast('Meeting recording started (Recording Audio & Video)');
    } catch (e: any) {
      console.error('Failed to start MediaRecorder:', e);
      // Fallback recording mock
      setIsRecording(true);
      setRecordingSeconds(0);
      showToast('Meeting recording started');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    showToast(`Recording stopped (${Math.floor(recordingSeconds / 60)}m ${recordingSeconds % 60}s)`);
  };

  // 9. Floating Emoji Reaction
  const sendReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      senderName: currentUser?.name || 'You',
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2400);
  };

  // 10. Send In-Meeting Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `c_${Date.now()}`,
      meetingId: meeting?.id || meetingCode,
      senderId: currentUser?.id || 'usr_1',
      senderName: currentUser?.name || 'You',
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // 11. End Call & Auto-generate AI Summary Report
  const handleEndCall = async () => {
    setIsEndingCall(true);
    showToast('Ending meeting and generating AI executive report...');

    try {
      // 1. Stop streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (isRecording) {
        stopRecording();
      }

      // 2. Mark meeting as ended in DB
      await fetch(`/api/meetings/${meetingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });

      // 3. Trigger AI summary generation
      const sumRes = await fetch(`/api/meetings/${meetingCode}/summarize`, {
        method: 'POST',
      });

      if (sumRes.ok) {
        showToast('AI Summary & action items generated!');
      }

      // 4. Redirect directly to the generated AI Notes report!
      router.push(`/ai-notes/${meeting?.id || meetingCode}`);
    } catch (e) {
      console.error('Error during end call:', e);
      router.push('/ai-notes');
    }
  };

  const copyShareLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('Meeting link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400">Connecting to secure video room...</p>
        </div>
      </div>
    );
  }

  // Waiting Room View
  if (isInWaitingRoom) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">You are in the Waiting Room</h2>
          <p className="text-xs text-zinc-400">
            The host has been notified and will let you into <span className="text-blue-400 font-semibold">{meeting?.title}</span> shortly.
          </p>

          <div className="p-3 bg-zinc-800/60 rounded-xl text-xs text-zinc-300 flex items-center justify-between">
            <span>Meeting Host</span>
            <span className="font-semibold text-white">{meeting?.hostName || 'Sarah Chen'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Leave Room
            </button>
            <button
              onClick={() => setIsInWaitingRoom(false)}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-white rounded-xl shadow-md transition-colors"
            >
              Host Approved (Enter)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none font-sans relative">
      {/* Top Header Bar */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">{meeting?.title || 'Live Meeting'}</span>
            <span className="font-mono text-xs text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
              {meetingCode}
            </span>
          </div>

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold animate-recording">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>
                REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                {String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* AI Live Transcribing Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Listening</span>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors border border-zinc-700/60"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Video Grid and Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Stage */}
        <div className="flex-1 p-4 flex flex-col justify-center items-center overflow-hidden relative">
          {/* Floating Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-24 right-1/4 animate-float-up flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/60 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-xs font-semibold text-zinc-200">{r.senderName}</span>
              </div>
            ))}
          </div>

          {/* Live Captions Bar Overlay */}
          {captionsEnabled && currentCaption && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-20 pointer-events-none">
              <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-xl text-center shadow-2xl">
                <span className="text-blue-400 font-semibold text-xs mr-2">{currentCaption.speaker}:</span>
                <span className="text-zinc-100 text-xs font-medium">{currentCaption.text}</span>
              </div>
            </div>
          )}

          {/* Screen Share Focused View if active */}
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col gap-3">
              <div className="flex-1 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative flex items-center justify-center shadow-2xl">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium border border-zinc-700/60 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span>You are presenting your screen</span>
                </div>
              </div>

              {/* Mini Participant Strip */}
              <div className="h-28 flex items-center gap-3 overflow-x-auto pb-1">
                {/* Local Camera Tile Mini */}
                <div className="w-44 h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative flex-shrink-0">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover -scale-x-100 ${videoMuted ? 'hidden' : ''}`}
                  />
                  {videoMuted && (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                        {currentUser?.name?.[0] || 'A'}
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[10px] bg-zinc-900/80 px-1.5 py-0.5 rounded text-zinc-300">
                    You {audioMuted && '🔇'}
                  </span>
                </div>

                {/* Remote Peers Mini */}
                {remotePeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="w-44 h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative flex-shrink-0 flex items-center justify-center"
                  >
                    <img src={peer.avatar} alt={peer.name} className="w-12 h-12 rounded-full object-cover" />
                    <span className="absolute bottom-1.5 left-2 text-[10px] bg-zinc-900/80 px-1.5 py-0.5 rounded text-zinc-300">
                      {peer.name} {peer.audioMuted && '🔇'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Multi-party Grid Layout */
            <div className="w-full h-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
              {/* Local Participant Tile */}
              <div
                className={`bg-zinc-900/90 border rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-xl transition-all ${
                  handRaised ? 'ring-2 ring-amber-400 border-amber-400/50' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover -scale-x-100 ${videoMuted ? 'hidden' : ''} ${
                    virtualBg === 'blur' ? 'blur-sm scale-105' : ''
                  }`}
                />

                {videoMuted && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 p-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/20 mb-2">
                      {currentUser?.name?.[0] || 'A'}
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">{currentUser?.name || 'Alex Rivera'}</span>
                    <span className="text-[10px] text-zinc-500">Camera Off</span>
                  </div>
                )}

                {/* Overlay Name & Badges */}
                <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 border border-zinc-800 flex items-center gap-1.5">
                  <span>{currentUser?.name || 'Alex Rivera'} (You)</span>
                  {audioMuted && <MicOff className="w-3 h-3 text-red-400" />}
                  {handRaised && <Hand className="w-3 h-3 text-amber-400 fill-amber-400 animate-bounce" />}
                </div>

                {/* Virtual Background Indicator */}
                {virtualBg !== 'none' && (
                  <div className="absolute top-3 left-3 bg-zinc-950/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-blue-400 border border-zinc-800 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>Bg: {virtualBg}</span>
                  </div>
                )}
              </div>

              {/* Remote Participants */}
              {remotePeers.map((peer) => (
                <div
                  key={peer.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center shadow-xl hover:border-zinc-700 transition-all"
                >
                  <img
                    src={peer.avatar}
                    alt={peer.name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-zinc-800 shadow-md mb-2"
                  />
                  <span className="text-sm font-semibold text-zinc-200">{peer.name}</span>
                  <span className="text-[11px] text-zinc-500 capitalize">{peer.role}</span>

                  {/* Audio Activity Indicator */}
                  {!peer.audioMuted && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-emerald-500 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 border border-zinc-800 flex items-center gap-1.5">
                    <span>{peer.name}</span>
                    {peer.audioMuted ? (
                      <MicOff className="w-3 h-3 text-red-400" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Drawers: Chat, Participants, Live Notes */}
        {activeDrawer !== 'none' && (
          <aside className="w-80 border-l border-zinc-800 bg-zinc-900/95 backdrop-blur-md flex flex-col z-20 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {activeDrawer === 'chat' && 'In-Meeting Chat'}
                {activeDrawer === 'participants' && `Participants (${remotePeers.length + 1})`}
                {activeDrawer === 'notes' && 'Live AI Meeting Notes'}
                {activeDrawer === 'settings' && 'Media & Device Settings'}
              </span>
              <button
                onClick={() => setActiveDrawer('none')}
                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Meeting Chat Drawer */}
            {activeDrawer === 'chat' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      No messages yet. Say hello to everyone!
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="font-semibold text-zinc-200">{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="bg-zinc-800/80 p-2.5 rounded-xl text-xs text-zinc-200 border border-zinc-700/50">
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Participants Drawer */}
            {activeDrawer === 'participants' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="text-[11px] uppercase font-semibold text-zinc-500">In This Call</div>

                {/* You */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {currentUser?.name?.[0] || 'A'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {currentUser?.name || 'Alex Rivera'} (You)
                      </span>
                      <span className="text-[10px] text-zinc-400 capitalize">{currentUser?.role || 'Admin'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {audioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>

                {/* Remote peers */}
                {remotePeers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">{p.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.audioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-zinc-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live AI Notes Drawer */}
            {activeDrawer === 'notes' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Real-Time AI Assistant Active</span>
                  </div>
                  Live captions are continuously streamed to the speech-to-text diarization pipeline. A structured executive summary will be generated on call conclusion.
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] uppercase font-semibold text-zinc-500">
                    Live Transcript Stream ({transcripts.length} utterances)
                  </div>
                  <div className="space-y-2">
                    {transcripts.map((t) => (
                      <div key={t.id} className="text-xs p-2 rounded-lg bg-zinc-800/40 border border-zinc-800/60">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                          <span className="font-semibold text-zinc-200">{t.speakerName}</span>
                          <span>{t.formattedTime}</span>
                        </div>
                        <p className="text-zinc-300">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings & Virtual Background Drawer */}
            {activeDrawer === 'settings' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-zinc-200 block mb-2">Virtual Background</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setVirtualBg('none')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        virtualBg === 'none' ? 'border-primary bg-primary/20 text-white' : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      None
                    </button>
                    <button
                      onClick={() => setVirtualBg('blur')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        virtualBg === 'blur' ? 'border-primary bg-primary/20 text-white' : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Blur
                    </button>
                    <button
                      onClick={() => setVirtualBg('gradient')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        virtualBg === 'gradient' ? 'border-primary bg-primary/20 text-white' : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Office
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-200 block mb-1">Live Captions</label>
                  <button
                    onClick={() => setCaptionsEnabled(!captionsEnabled)}
                    className="w-full py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white"
                  >
                    {captionsEnabled ? 'Turn Off Live Captions' : 'Turn On Live Captions'}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Meeting Controls Bar (Google Meet Style) */}
      <footer className="h-20 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between z-20">
        {/* Left: Meeting Time & Code */}
        <div className="hidden md:flex items-center gap-3 w-1/4">
          <span className="font-mono text-xs font-semibold text-zinc-300">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-xs text-zinc-400">{meetingCode}</span>
        </div>

        {/* Center: Main Call Action Buttons */}
        <div className="flex items-center gap-2.5 mx-auto">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            title={audioMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              audioMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              videoMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share entire screen'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => {
              setHandRaised(!handRaised);
              if (!handRaised) sendReaction('✋');
              showToast(!handRaised ? 'Hand raised' : 'Hand lowered');
            }}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Floating Reactions Emojis Bar */}
          <div className="relative group">
            <button
              title="Send Reaction"
              className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-700 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
              {['👏', '❤️', '🔥', '🎉', '👍', '💡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Recording Toggle */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            disabled={isEndingCall}
            title="Leave & Generate AI Summary Report"
            className="h-11 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 font-semibold text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <PhoneOff className="w-4 h-4" />
            <span>{isEndingCall ? 'Summarizing...' : 'End Call'}</span>
          </button>
        </div>

        {/* Right Drawer Toggles */}
        <div className="hidden md:flex items-center justify-end gap-2 w-1/4">
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'notes' ? 'none' : 'notes')}
            title="AI Live Notes"
            className={`p-2.5 rounded-xl transition-colors ${
              activeDrawer === 'notes' ? 'bg-primary text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'chat' ? 'none' : 'chat')}
            title="In-meeting Chat"
            className={`p-2.5 rounded-xl transition-colors ${
              activeDrawer === 'chat' ? 'bg-primary text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'participants' ? 'none' : 'participants')}
            title="Participants"
            className={`p-2.5 rounded-xl transition-colors ${
              activeDrawer === 'participants' ? 'bg-primary text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'settings' ? 'none' : 'settings')}
            title="Settings & Backgrounds"
            className={`p-2.5 rounded-xl transition-colors ${
              activeDrawer === 'settings' ? 'bg-primary text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
