'use client';

import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Mail,
  UserCheck,
  Building,
  Check,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';

export default function TeamWorkspacePage() {
  const { currentUser, activeWorkspace, users, switchUser, showToast, refreshAuth } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: inviteEmail.trim(),
          name: inviteName.trim() || inviteEmail.split('@')[0],
          role: inviteRole,
        }),
      });

      if (res.ok) {
        showToast(`Invitation sent and member registered: ${inviteEmail}`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        await refreshAuth();
      }
    } catch (e) {
      console.error(e);
      showToast('Error sending invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team & Workspaces</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Role-Based Access
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization workspaces, team member roles (Admin, Host, Member, Guest), and meeting authorizations.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Current Workspace Card */}
      <div className="p-5 rounded-xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Organization Workspace
            </span>
            <h2 className="text-lg font-bold text-foreground">{activeWorkspace?.name}</h2>
            <span className="text-xs text-muted-foreground font-mono">
              slug: {activeWorkspace?.slug}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{users.length} Active Members</span> with verified workspace permissions
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/60 bg-secondary/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Workspace Members ({users.length})</h3>
          <span className="text-[11px] text-muted-foreground">
            Click &quot;Switch User Profile&quot; to test different role permissions
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {users.map((user) => {
            const isCurrent = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isCurrent ? 'bg-primary/5' : 'hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {user.name[0]}
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground block truncate">
                        {user.name}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block truncate">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      user.role === 'admin'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : user.role === 'host'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : user.role === 'member'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}
                  >
                    {user.role}
                  </span>

                  {!isCurrent && (
                    <button
                      onClick={() => switchUser(user.id)}
                      className="px-3 py-1 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Switch to Profile
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-base font-bold text-foreground mb-1">Invite Team Member</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add a new collaborator to the {activeWorkspace?.name} workspace.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Patel"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="maya.patel@meetai.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="admin">Admin (Full settings, workspace & meeting control)</option>
                  <option value="host">Host (Can create rooms, approve waiting room, record)</option>
                  <option value="member">Member (Can join meetings, view notes, manage tasks)</option>
                  <option value="guest">Guest (Restricted view, requires host approval)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
