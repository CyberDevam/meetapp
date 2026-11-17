import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const user = db.users.find((u) => u.id === db.settings.currentUserId) || db.users[0];
  const workspace = db.workspaces.find((w) => w.id === db.settings.activeWorkspaceId) || db.workspaces[0];

  return NextResponse.json({
    user,
    workspace,
    users: db.users,
    workspaces: db.workspaces,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    // Login or Switch
    if (body.action === 'login') {
      const existing = db.users.find((u) => u.email.toLowerCase() === body.email?.toLowerCase());
      if (existing) {
        db.settings.currentUserId = existing.id;
        saveDb(db);
        return NextResponse.json({ success: true, user: existing });
      } else {
        // Create new user
        const newUser = {
          id: `usr_${Date.now()}`,
          name: body.name || body.email.split('@')[0],
          email: body.email,
          role: (body.role as any) || 'member',
          workspaceId: db.settings.activeWorkspaceId,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.email}`,
          createdAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        db.settings.currentUserId = newUser.id;
        saveDb(db);
        return NextResponse.json({ success: true, user: newUser });
      }
    }

    if (body.action === 'switch') {
      const user = db.users.find((u) => u.id === body.userId);
      if (user) {
        db.settings.currentUserId = user.id;
        saveDb(db);
        return NextResponse.json({ success: true, user });
      }
    }

    if (body.action === 'update_profile') {
      const userIdx = db.users.findIndex((u) => u.id === db.settings.currentUserId);
      if (userIdx !== -1) {
        db.users[userIdx] = {
          ...db.users[userIdx],
          name: body.name || db.users[userIdx].name,
          email: body.email || db.users[userIdx].email,
          role: body.role || db.users[userIdx].role,
        };
        saveDb(db);
        return NextResponse.json({ success: true, user: db.users[userIdx] });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
