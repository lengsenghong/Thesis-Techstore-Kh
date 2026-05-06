"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Shield, Users, ChevronLeft, ChevronRight,
  UserCog, UserX, GraduationCap, CheckCircle, XCircle,
  Clock, Eye, X,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { User } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[idx]}`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
        <Shield className="w-3 h-3" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
      User
    </span>
  );
}

function StudentBadge({ status }: { status?: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100">
        <CheckCircle className="w-2.5 h-2.5" /> Student
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
        <Clock className="w-2.5 h-2.5" /> Pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
        <XCircle className="w-2.5 h-2.5" /> Rejected
      </span>
    );
  }
  return null;
}

// ── Card preview modal ────────────────────────────────────────────────────────

function CardPreviewModal({
  user,
  onClose,
  onApprove,
  onReject,
  isPending,
}: {
  user: User;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card image */}
        <div className="p-5">
          {user.studentCardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.studentCardUrl}
              alt="Student card"
              className="w-full rounded-xl border border-gray-200 object-contain max-h-72 bg-gray-50"
            />
          ) : (
            <div className="w-full h-48 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
              No card image available
            </div>
          )}
        </div>

        {/* Actions */}
        {user.studentVerificationStatus === "pending" && (
          <div className="flex gap-3 px-5 pb-5">
            <button
              onClick={onReject}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={onApprove}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PageTab = "all" | "pending";

export default function AdminUsersPage() {
  const qc = useQueryClient();

  // All-users tab state
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  // Tab
  const [activeTab, setActiveTab] = useState<PageTab>("all");

  // Card preview modal
  const [previewUser, setPreviewUser] = useState<User | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search, roleFilter],
    queryFn: () =>
      adminApi.users.list({
        page,
        limit: 20,
        search,
        ...(roleFilter !== "all" && { role: roleFilter }),
      }),
    enabled: activeTab === "all",
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "users", "pending-verification"],
    queryFn:  () => adminApi.users.listPendingVerification(),
    enabled:  activeTab === "pending",
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const toggleRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminApi.users.updateRole(id, role),
    onSuccess: () => {
      toast.success("User role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const verifyStudent = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      adminApi.users.verifyStudent(id, action),
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Student verified!" : "Student card rejected");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setPreviewUser(null);
    },
    onError: () => toast.error("Action failed"),
  });

  const users: User[]        = data?.items ?? [];
  const total: number        = data?.total ?? 0;
  const totalPages: number   = data?.totalPages ?? 1;
  const pendingUsers: User[] = pendingData ?? [];
  const adminCount           = users.filter((u) => u.role === "admin").length;

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} registered users
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-700">
            <Shield className="w-3 h-3" />
            {adminCount} admins
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-muted-foreground">
            <Users className="w-3 h-3" />
            {(total - adminCount).toLocaleString()} users
          </div>
          {pendingUsers.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-xs font-semibold text-yellow-700">
              <Clock className="w-3 h-3" />
              {pendingUsers.length} pending verification
            </div>
          )}
        </div>
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary border border-border w-fit mb-5">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "all"
              ? "bg-white text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "pending"
              ? "bg-white text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Pending Verification
          {pendingUsers.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500 text-white">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ALL USERS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "all" && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border">
              {(["all", "admin", "user"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    roleFilter === r
                      ? "bg-white text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Joined
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Student
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse flex-shrink-0" />
                              <div className="space-y-1.5 flex-1">
                                <div className="h-3.5 bg-secondary rounded-lg animate-pulse w-32" />
                                <div className="h-3 bg-secondary rounded-lg animate-pulse w-44" />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <div className="h-3 bg-secondary rounded-lg animate-pulse w-20" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="h-6 bg-secondary rounded-full animate-pulse w-16 mx-auto" />
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <div className="h-5 bg-secondary rounded-full animate-pulse w-14 mx-auto" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="h-8 bg-secondary rounded-lg animate-pulse w-24 ml-auto" />
                          </td>
                        </tr>
                      ))
                    : users.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-8 h-8 text-muted-foreground/30" />
                              <p className="text-sm text-muted-foreground">No users found</p>
                              {search && (
                                <button
                                  onClick={() => setSearch("")}
                                  className="text-xs text-primary hover:underline mt-1"
                                >
                                  Clear search
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    : users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-secondary/30 transition-colors duration-150 group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.name} />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-5 py-3.5 text-center hidden md:table-cell">
                            <StudentBadge status={user.studentVerificationStatus} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View card button — only for students with a card */}
                              {user.isStudent && user.studentCardUrl && (
                                <button
                                  onClick={() => setPreviewUser(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Card
                                </button>
                              )}
                              {/* Toggle role */}
                              <button
                                onClick={() =>
                                  toggleRole.mutate({
                                    id: user.id,
                                    role: user.role === "admin" ? "user" : "admin",
                                  })
                                }
                                disabled={toggleRole.isPending}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-50 ${
                                  user.role === "admin"
                                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                    : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
                                }`}
                              >
                                {user.role === "admin"
                                  ? <><UserX className="w-3 h-3" /> Revoke</>
                                  : <><UserCog className="w-3 h-3" /> Make Admin</>
                                }
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-secondary/20">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: PENDING VERIFICATION                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "pending" && (
        <div className="card-base overflow-hidden">
          {pendingLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-sm">All caught up!</p>
              <p className="text-xs text-muted-foreground">No student cards are waiting for review.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <Avatar name={user.name} />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Card thumbnail */}
                  {user.studentCardUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.studentCardUrl}
                      alt="Student card thumbnail"
                      className="w-16 h-10 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewUser(user)}
                    />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPreviewUser(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button
                      onClick={() => verifyStudent.mutate({ id: user.id, action: "reject" })}
                      disabled={verifyStudent.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                    <button
                      onClick={() => verifyStudent.mutate({ id: user.id, action: "approve" })}
                      disabled={verifyStudent.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Card preview modal ───────────────────────────────────────────── */}
      {previewUser && (
        <CardPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
          onApprove={() => verifyStudent.mutate({ id: previewUser.id, action: "approve" })}
          onReject={() => verifyStudent.mutate({ id: previewUser.id, action: "reject" })}
          isPending={verifyStudent.isPending}
        />
      )}
    </div>
  );
}