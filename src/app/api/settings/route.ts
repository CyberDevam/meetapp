import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    settings: {
      ...db.settings,
      openaiApiKeyMasked: db.settings.openaiApiKey ? 'sk-••••••••' + db.settings.openaiApiKey.slice(-4) : '',
      geminiApiKeyMasked: db.settings.geminiApiKey ? '••••••••' + db.settings.geminiApiKey.slice(-4) : '',
    },
    users: db.users,
    workspaces: db.workspaces,
    currentUser: db.users.find((u) => u.id === db.settings.currentUserId) || db.users[0],
    activeWorkspace: db.workspaces.find((w) => w.id === db.settings.activeWorkspaceId) || db.workspaces[0],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    if (body.currentUserId) {
      db.settings.currentUserId = body.currentUserId;
    }
    if (body.activeWorkspaceId) {
      db.settings.activeWorkspaceId = body.activeWorkspaceId;
    }
    if (body.openaiApiKey !== undefined) {
      db.settings.openaiApiKey = body.openaiApiKey.trim();
    }
    if (body.geminiApiKey !== undefined) {
      db.settings.geminiApiKey = body.geminiApiKey.trim();
    }
    if (body.livekitUrl !== undefined) {
      db.settings.livekitUrl = body.livekitUrl.trim();
    }
    if (body.livekitApiKey !== undefined) {
      db.settings.livekitApiKey = body.livekitApiKey.trim();
    }

    saveDb(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
