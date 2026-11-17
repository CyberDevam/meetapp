# MeetAI - All-in-One AI Meeting Platform

A production-ready, modern AI-powered meeting platform that replaces Google Meet, Zoom, and separate AI meeting-notes apps.

---

## 🚀 Key Features

### 1. Video & Audio Meetings (Google Meet Inspiration)
- **High-definition WebRTC Video & Audio**: Real-time peer-to-peer conferencing.
- **Microphone & Camera Controls**: Individual track toggles with visual indicators.
- **Screen Sharing**: Native `getDisplayMedia` screen capture with focused view.
- **Virtual Backgrounds**: Real-time canvas stream blur and office background simulation.
- **In-Call Reactions & Raise Hand**: Floating emoji animations (`👏`, `❤️`, `🔥`, `🎉`, `👍`, `💡`) and hand-raise alerts.
- **Waiting Room & Host Approval**: Configurable waiting room where hosts approve guest entry.
- **Live In-Meeting Chat**: Real-time text messaging between participants.

### 2. Real-Time AI Meeting Assistant
- **Live Speech-to-Text Transcription**: Browser-side Web Speech recognition pipeline with real-time speaker attribution.
- **Live Captions Overlay**: Live subtitling floating above the meeting controls.
- **Automated End-of-Meeting Executive Report**: When the call ends, the AI assistant automatically structures:
  - Meeting overview
  - Executive summary
  - Key discussion points
  - Important decisions made
  - Questions raised
  - Problems and challenges discussed
  - Action items with assigned team members, priorities, and deadlines
  - Unresolved questions and next steps

### 3. Task & Follow-up Management (Linear Inspiration)
- **Automatic Action Item Conversion**: Action items extracted by AI during calls are directly synchronized to the Linear-style task board.
- **Views**: Interactive Kanban board (Pending, In Progress, Completed) and List view.
- **Task Metadata**: Assignee, Priority (`Urgent`, `High`, `Medium`, `Low`), Due Date, and Linked Meeting.

### 4. AI Chat with Meeting History (ChatGPT Inspiration)
- **Conversational Search**: Query your entire meeting archive.
- **Natural Language Answers**: Answers with verbatim citations, meeting dates, speaker quotes, and timestamps.
- **Pre-built Prompt Pills**: Quick shortcuts for questions like *"What did Sarah say about latency?"* or *"Draft a follow-up email"*.
- **Meeting Scope Filter**: Query all meetings or isolate a specific session.

### 5. Recording & Synchronized Transcript Playback
- **In-Browser Video & Audio Recording**: Real-time `MediaRecorder` captures meeting streams and exports `.webm` files.
- **Synchronized Transcript Timeline**: Transcript entries update in real time as video plays.
- **Click-to-Seek**: Clicking any transcript line immediately jumps the video player to that exact timestamp.
- **Exports**: Download video recordings and export transcripts as `.TXT` or `.PDF`.

### 6. Calendar & Team Workspaces
- **Integrated Calendar**: Schedule future and recurring syncs, manage time zones.
- **One-Click Calendar Invites**: Download `.ics` files compatible with Google Calendar and Microsoft Outlook.
- **Role-Based Access Control**: `Admin`, `Host`, `Member`, `Guest` roles with profile switcher.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, jsPDF.
- **Signaling & WebRTC**: Real-time signaling manager with SDP/ICE candidate routing.
- **AI Processing**: Built-in high-fidelity local AI engine with zero-config fallback, plus optional pluggable OpenAI (`gpt-4o-mini`) and Google Gemini API keys in Settings.
- **Data Persistence**: JSON/SQLite database layer with automated schemas located in `.data/database.json`.

---

## 💻 Running the Application

The production build is already compiled and running on `http://localhost:3000`.

To start development mode:
```bash
npm run dev
```

To build and start production:
```bash
npm run build
npm run start
```
