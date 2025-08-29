"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Check, X } from "lucide-react";
import {
  collection,
  getDocsFromServer,   // ✅ non-streaming read
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/context/ProtectedRoute";

type RowUser = {
  id: string;
  name: string;
  email: string;
  role: "free" | "premium" | "admin";
  accountStatus: "Active" | "Suspended";
  joinedISO: string;
  subscription?: { plan?: "free" | "premium"; active?: boolean; billing?: "monthly" | "yearly" | null };
  photoURL?: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RowUser[]>([]);
  const [filtered, setFiltered] = useState<RowUser[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "free" | "premium" | "admin">("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<RowUser | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadUsers = async () => {
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocsFromServer(collection(db, "users")); // ✅
      const rows: RowUser[] = snap.docs.map((d) => {
        const data: any = d.data() || {};
        let joinedISO = new Date().toISOString();
        const createdAt = data.createdAt;
        if (createdAt instanceof Timestamp) joinedISO = createdAt.toDate().toISOString();
        else if (typeof createdAt === "string") joinedISO = createdAt;
        else if (data.joined) joinedISO = new Date(data.joined).toISOString();

        const plan = data.subscription?.plan ?? (data.role === "premium" ? "premium" : "free");
        const active = data.subscription?.active ?? plan === "premium";
        const billing = data.subscription?.billing ?? null;

        const role = (data.role?.toLowerCase?.() ?? "free") as RowUser["role"];
        const status = (data.accountStatus === "Suspended" ? "Suspended" : "Active") as RowUser["accountStatus"];

        return {
          id: d.id,
          name: data.name || data.displayName || "Member",
          email: data.email || "—",
          role: role === "admin" ? "admin" : plan === "premium" ? "premium" : "free",
          accountStatus: status,
          joinedISO,
          subscription: { plan, active, billing },
          photoURL: data.photoURL ?? null,
        };
      });
      setUsers(rows);
    } catch (e: any) {
      console.error("Users load error:", e);
      setErr(
        e?.code === "permission-denied"
          ? "Permission denied loading users. Check Firestore rules for admin reads."
          : e?.message || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let base = users;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      base = base.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (roleFilter !== "all") base = base.filter((u) => u.role === roleFilter);
    setFiltered(base);
    setPage(1);
  }, [q, roleFilter, users]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / perPage)), [filtered.length]);
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  const toggleSuspend = async (u: RowUser) => {
    const newStatus = u.accountStatus === "Active" ? "Suspended" : "Active";
    await updateDoc(doc(db, "users", u.id), { accountStatus: newStatus });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, accountStatus: newStatus } : x)));
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Users</h1>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="pl-9 pr-3 py-2 border rounded-md text-sm"
                placeholder="Search name or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="py-2 px-3 border rounded-md text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">All roles</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {err} <button onClick={loadUsers} className="underline ml-2">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>No users found.</td></tr>
              ) : (
                visible.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                          {u.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === "premium" ? "bg-purple-100 text-purple-800"
                        : u.role === "admin" ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.accountStatus === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>{u.accountStatus}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.joinedISO).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md hover:bg-gray-50" onClick={() => setViewUser(u)} title="View">
                          <Eye className="h-4 w-4" /> View
                        </button>
                        <button
                          className={`inline-flex items-center gap-1 px-2 py-1 text-sm text-white rounded-md ${
                            u.accountStatus === "Active" ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
                          }`}
                          onClick={() => toggleSuspend(u)}
                          title={u.accountStatus === "Active" ? "Suspend" : "Activate"}
                        >
                          {u.accountStatus === "Active" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          {u.accountStatus === "Active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
