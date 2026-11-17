'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
  Check,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Task } from '@/types';
import { useApp } from '@/context/AppContext';

export default function TasksPage() {
  const { showToast } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);

  // New task modal
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('Alex Rivera');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          assignedPerson: newAssignee,
          priority: newPriority,
          dueDate: newDueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          status: 'pending',
        }),
      });

      if (res.ok) {
        showToast('Task created successfully');
        setShowModal(false);
        setNewTitle('');
        setNewDesc('');
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating task');
    }
  };

  const handleUpdateStatus = async (taskId: string, nextStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
        );
        showToast(`Task moved to ${nextStatus.replace('_', ' ')}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        showToast('Task deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignedPerson?.toLowerCase().includes(q) ||
        t.meetingTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks & Action Items</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Linear Style
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Action items automatically parsed by AI during meetings with assignees, priorities, and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-secondary rounded-lg border border-border flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-secondary/60 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e: any) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-secondary/60 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter tasks by title, assignee, meeting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['pending', 'in_progress', 'completed'] as const).map((columnKey) => {
            const colTasks = filteredTasks.filter((t) => t.status === columnKey);
            const titleMap = {
              pending: 'Pending Action Items',
              in_progress: 'In Progress',
              completed: 'Completed',
            };

            return (
              <div key={columnKey} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        columnKey === 'completed'
                          ? 'bg-emerald-500'
                          : columnKey === 'in_progress'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                      {titleMap[columnKey]}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[400px] p-2 bg-secondary/20 rounded-xl border border-border/40">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-card border border-border/80 hover:border-border shadow-sm space-y-3 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-xs text-foreground leading-snug">
                            {task.title}
                          </h4>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-muted-foreground hover:text-red-400 p-1 rounded"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {task.meetingTitle && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md line-clamp-1">
                            <Video className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{task.meetingTitle}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                          <span className="text-muted-foreground font-medium">{task.assignedPerson}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                              task.priority === 'urgent'
                                ? 'bg-red-500/10 text-red-400'
                                : task.priority === 'high'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Status transition dropdown / quick button */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {columnKey !== 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'pending')}
                              className="text-[10px] px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground"
                            >
                              ← Pending
                            </button>
                          )}
                          {columnKey !== 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                            >
                              In Progress
                            </button>
                          )}
                          {columnKey !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'completed')}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 ml-auto"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Linear-Style List View */
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No tasks found</div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            task.id,
                            isDone ? 'pending' : 'completed'
                          )
                        }
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-muted-foreground/40 hover:border-foreground'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="truncate">
                        <span
                          className={`text-xs font-medium block truncate ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.meetingTitle && (
                          <span className="text-[10px] text-muted-foreground truncate block">
                            From: {task.meetingTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{task.assignedPerson}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'bg-red-500/10 text-red-400'
                            : task.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{task.dueDate}</span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-muted-foreground hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-base font-bold text-foreground mb-1">Create Action Task</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add a follow-up item manually or assign it to a team member.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement WebRTC audio track tagging"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details, acceptance criteria..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Assignee</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Alex Rivera">Alex Rivera</option>
                    <option value="Sarah Chen">Sarah Chen</option>
                    <option value="David Kim">David Kim</option>
                    <option value="Elena Rostova">Elena Rostova</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
