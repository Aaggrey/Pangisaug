"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, CheckCircle2, UserPlus, Pencil, X, Save } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  createdAt: string;
  _count: { properties: number; bookings: number };
}

const roles = ["USER", "LANDLORD", "ADMIN"];

const roleBadge: Record<string, string> = {
  ADMIN: "bg-brand-100 text-brand-800",
  LANDLORD: "bg-amber-100 text-amber-800",
  USER: "bg-sky-100 text-sky-800",
};

export function ManageUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", phone: "" });
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "USER", password: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id: string, role: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMessage(d.error ?? "Failed to update role");
      return;
    }
    await load();
    setMessage("User role updated.");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user account?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setMessage(d.error ?? "Failed to delete");
      return;
    }
    await load();
    setMessage("User deleted.");
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.name || !form.email || !form.password) {
      setMessage("Name, email, and password are required.");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setMessage(d.error ?? "Failed to create user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "USER", phone: "" });
    setAdding(false);
    await load();
    setMessage("User account created.");
  };

  const openEdit = (u: AdminUser) => {
    setEditError(null);
    setEditing(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone ?? "", role: u.role, password: "" });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    if (!editForm.name || !editForm.email) {
      setEditError("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          phone: editForm.phone || null,
          password: editForm.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user");
      await load();
      setEditing(null);
      setMessage(`User "${data.user.name}" updated.`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (!users) {
    return <div className="grid h-40 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="space-y-5">
      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{users.length} accounts</p>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          <UserPlus className="size-4" /> Add user
        </button>
      </div>

      {adding && (
        <form onSubmit={addUser} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-5">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">
            <option value="USER">Member</option>
            <option value="LANDLORD">Landlord</option>
            <option value="ADMIN">Administrator</option>
          </select>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
            Create
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold ${roleBadge[u.role]}`}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{u._count.properties}</td>
                <td className="px-4 py-3 text-slate-600">{u._count.bookings}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => openEdit(u)}
                      title="Edit user"
                      className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand-100 hover:text-brand-700"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => remove(u.id)}
                      title="Delete user"
                      className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Edit user</h3>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Full name</span>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Email</span>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Phone</span>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} placeholder="09xx xxx xxxx" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Role</span>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={inputCls}>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">New password</span>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className={inputCls}
                  placeholder={editing.id ? "Leave blank to keep current password" : ""}
                />
              </label>

              {editError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{editError}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}