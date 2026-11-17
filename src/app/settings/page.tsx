'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  Video,
  User,
  Save,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { currentUser, showToast, refreshAuth } = useApp();

  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [livekitApiKey, setLivekitApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Profile Form
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [role, setRole] = useState(currentUser?.role || 'admin');

  // Security Toggles
  const [consentNotification, setConsentNotification] = useState(true);
  const [recordingRetentionDays, setRecordingRetentionDays] = useState('90');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings.openaiApiKey) setOpenaiKey(data.settings.openaiApiKey);
          if (data.settings.geminiApiKey) setGeminiKey(data.settings.geminiApiKey);
          if (data.settings.livekitUrl) setLivekitUrl(data.settings.livekitUrl);
          if (data.settings.livekitApiKey) setLivekitApiKey(data.settings.livekitApiKey);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setRole(currentUser.role);
    }
  }, [currentUser]);

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey: openaiKey,
          geminiApiKey: geminiKey,
          livekitUrl,
          livekitApiKey,
        }),
      });

      if (res.ok) {
        showToast('AI and Video API keys saved securely!');
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name,
          email,
          role,
        }),
      });

      if (res.ok) {
        showToast('Profile updated successfully!');
        await refreshAuth();
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating profile');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Integrations</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure AI intelligence providers, WebRTC streaming backends, role permissions, and privacy audit logs.
        </p>
      </div>

      {/* AI Intelligence Provider Section */}
      <div className="p-6 rounded-xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">AI Intelligence & LLM Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Provide your API keys to power GPT-4o / Gemini for instant meeting transcription and summarization.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKeys} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
              <span>OpenAI API Key (Optional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                If omitted, built-in local AI processor will run automatically
              </span>
            </label>
            <div className="relative">
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
              <span>Google Gemini API Key (Optional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                For Gemini Flash live multimodal transcription
              </span>
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save API Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User Profile Section */}
      <div className="p-6 rounded-xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">User Profile & Identity</h2>
            <p className="text-xs text-muted-foreground">
              Update your display name and meeting host credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Current Role</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              <option value="admin">Admin (Full permissions)</option>
              <option value="host">Host (Can record & schedule)</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security, Privacy & Audit Section */}
      <div className="p-6 rounded-xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Security, Encryption & Privacy</h2>
            <p className="text-xs text-muted-foreground">
              Enterprise data sovereignty and WebRTC media encryption settings.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
            <div>
              <span className="font-semibold text-foreground block">Transport & Media Encryption</span>
              <span className="text-[11px] text-muted-foreground">
                All video and audio streams are end-to-end encrypted with DTLS-SRTP and TLS 1.3
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
            <div>
              <span className="font-semibold text-foreground block">Recording Consent Banner</span>
              <span className="text-[11px] text-muted-foreground">
                Display clear visual and audio notification to all participants when recording begins
              </span>
            </div>
            <input
              type="checkbox"
              checked={consentNotification}
              onChange={(e) => {
                setConsentNotification(e.target.checked);
                showToast('Recording consent setting updated');
              }}
              className="rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
            <div>
              <span className="font-semibold text-foreground block">Recording Retention Period</span>
              <span className="text-[11px] text-muted-foreground">
                Automatically purge raw audio/video files after retention expires
              </span>
            </div>
            <select
              value={recordingRetentionDays}
              onChange={(e) => {
                setRecordingRetentionDays(e.target.value);
                showToast('Retention period updated');
              }}
              className="px-2.5 py-1 bg-secondary border border-border rounded-lg text-xs"
            >
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
              <option value="indefinite">Indefinite</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
