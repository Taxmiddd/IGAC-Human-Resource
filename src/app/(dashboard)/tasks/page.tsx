"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, CheckSquare, Clock, Loader, CheckCheck, X, Flag, AlertCircle, Edit } from "lucide-react";
import type { Task, Member } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

type TaskRow = Task & {
  assignee?: Pick<Member, "fullName" | "employeeId" | "photoUrl"> | null;
  creator?: { name: string } | null;
};

const COLUMNS = [
  { key: "todo",        label: "To Do",       icon: CheckSquare, color: "var(--color-muted)" },
  { key: "in_progress", label: "In Progress",  icon: Loader,      color: "#3b82f6" },
  { key: "review",      label: "In Review",    icon: Clock,       color: "#f59e0b" },
  { key: "completed",   label: "Completed",    icon: CheckCheck,  color: "#22c55e" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#64748b", medium: "#3b82f6", high: "#f59e0b", critical: "#ef4444",
};

function TaskModal({ task, onClose, onSuccess }: { task?: TaskRow; onClose: () => void; onSuccess: () => void }) {
  const [members, setMembers] = useState<Pick<Member, "id" | "fullName" | "employeeId">[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assignedTo: task?.assignedTo ?? "",
    priority: task?.priority ?? "medium",
    eventName: task?.eventName ?? "",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  });

  useEffect(() => {
    fetch("/api/members?limit=300").then(r => r.json()).then(d => setMembers(d.data ?? []));
  }, []);

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required"); return; }
    setLoading(true);

    const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate ? new Date(form.dueDate) : null };
    
    if (task) {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error("Failed to update task"); setLoading(false); return; }
      toast.success("Task updated");
    } else {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error("Failed to create task"); setLoading(false); return; }
      toast.success("Task created");
    }
    onSuccess();
    onClose();
  }

  return (
    <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass" style={{ borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-foreground)" }}>
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.2rem" }}><X size={16} /></button>
        </div>
        
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Title *</label>
            <input className="input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title…" required />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set("description", e.target.value)} style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Assign To</label>
              <select className="input" value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
                <option value="">— Unassigned —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Priority</label>
              <select className="input" value={form.priority} onChange={e => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Event (optional)</label>
              <input className="input" value={form.eventName} onChange={e => set("eventName", e.target.value)} placeholder="MUN Dhaka 2025" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving…" : (task ? "Save Changes" : "Create Task")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function moveTask(id: string, newStatus: string) {
  await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const json = await res.json();
    setTasks(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function handleMove(id: string, status: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
    await moveTask(id, status);
    toast.success("Task updated");
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success("Task cancelled");
  }

  const byStatus = (status: string) => tasks.filter(t => t.status === status);

  const now = new Date().getTime();

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {(isCreating || editingTask) && (
        <TaskModal 
          task={editingTask ?? undefined}
          onClose={() => { setIsCreating(false); setEditingTask(null); }} 
          onSuccess={fetchTasks} 
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)" }}>Task Board</h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{tasks.length} active tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}><Plus size={15} /> New Task</button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", alignItems: "start", overflowX: "auto", paddingBottom: "1rem" }}>
        {COLUMNS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} style={{ minWidth: "250px" }}>
            {/* Column header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1rem", marginBottom: "0.5rem",
              background: `${color}12`, border: `1px solid ${color}20`,
              borderRadius: "8px",
            }}>
              <Icon size={15} color={color} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700, color, background: `${color}20`, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                {byStatus(key).length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "120px" }}>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "10px" }} />
                ))
              ) : (
                byStatus(key).map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < now && task.status !== "completed";
                  return (
                    <div key={task.id} className="card" style={{ padding: "0.875rem", border: isOverdue ? "1px solid rgba(239,68,68,0.3)" : undefined }}>
                      {/* Priority + Actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: PRIORITY_COLORS[task.priority], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          <Flag size={10} color={PRIORITY_COLORS[task.priority]} />
                          {task.priority}
                        </span>
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                          <button onClick={() => setEditingTask(task)} className="btn btn-ghost" style={{ padding: "0.15rem", opacity: 0.5 }} title="Edit task">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleCancel(task.id)} className="btn btn-ghost" style={{ padding: "0.15rem", opacity: 0.5 }} title="Cancel task">
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-foreground)", marginBottom: "0.4rem", lineHeight: 1.3 }}>{task.title}</p>

                      {task.assignee && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.6rem", fontWeight: 700, color: "var(--color-primary)", flexShrink: 0,
                          }}>
                            {task.assignee.fullName[0]}
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>{task.assignee.fullName}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <p style={{ fontSize: "0.7rem", color: isOverdue ? "#ef4444" : "var(--color-muted)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: isOverdue ? 600 : 400 }}>
                          {isOverdue && <AlertCircle size={10} />}
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}

                      {task.eventName && (
                        <span className="badge" style={{ background: "rgba(32,201,151,0.1)", color: "var(--color-primary)", marginBottom: "0.5rem", display: "inline-block" }}>
                          {task.eventName}
                        </span>
                      )}

                      {/* Move buttons */}
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                        {COLUMNS.filter(c => c.key !== key).map(c => (
                          <button key={c.key} onClick={() => handleMove(task.id, c.key)}
                            className="btn btn-ghost"
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem", color: c.color }}>
                            → {c.label.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
