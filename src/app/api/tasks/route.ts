import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Task } from '@/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const meetingId = searchParams.get('meetingId');

  let tasks = [...db.tasks];

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (meetingId) {
    tasks = tasks.filter((t) => t.meetingId === meetingId);
  }

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newTask: Task = {
      id: `tsk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      meetingId: body.meetingId,
      meetingTitle: body.meetingTitle,
      title: body.title.trim(),
      description: body.description || '',
      assignedPerson: body.assignedPerson || 'Alex Rivera',
      assignedPersonAvatar: body.assignedPersonAvatar,
      priority: body.priority || 'medium',
      dueDate: body.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);
    saveDb(db);

    return NextResponse.json({ task: newTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = getDb();
    const idx = db.tasks.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    db.tasks[idx] = {
      ...db.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    return NextResponse.json({ task: db.tasks[idx] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  const db = getDb();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  saveDb(db);

  return NextResponse.json({ success: true });
}
