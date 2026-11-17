import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'MeetAI - All-in-One AI Meeting Platform',
  description: 'Production-ready AI meeting platform replacing Google Meet, Zoom, and AI note apps with real-time transcription, automated summaries, and task sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex antialiased">
        <AppProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
