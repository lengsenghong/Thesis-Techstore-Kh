"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Mail, Phone, MapPin, Shield, CheckCircle, Clock,
  XCircle, Upload, LogOut, Package, ChevronRight,
  Edit3, Save, X, GraduationCap, ImageIcon, Heart,
  ShoppingBag, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, ordersApi } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Verification badge ───────────────────────────────────────────────────────
function VerificationBadge({ status }: { status?: string }) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold">
      <CheckCircle className="w-3 h-3" /> Verified Student
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
      <Clock className="w-3 h-3" /> Pending Review
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return null;
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing:"bg-purple-50 text-purple-700 border-purple-200",
  shipped:   "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({ label, value, editing, onChange, placeholder, readOnly }: {
  label: string; value: string; editing: boolean;
  onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5">
        {label}
      </label>
      {editing && !readOnly ? (
        <input
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      ) : (
        <p className={`text-sm font-medium px-0.5 ${value ? "text-gray-800" : "text-gray-300"}`}>
          {value || placeholder || "—"}
          {readOnly && (
            <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold">locked</span>
          )}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router           = useRouter();
  const qc               = useQueryClient();

  const [editing,      setEditing]      = useState(false);
  const [uploadingCard, setUploadingCard] = useState(false);
  const [cardPreview,  setCardPreview]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:    user?.name    ?? "",
    phone:   user?.phone   ?? "",
    address: user?.address ?? "",
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn:  ordersApi.list,
    enabled:  !!user,
  });

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update profile");
    },
  });

  const handleCancel = () => {
    setForm({ name: user?.name ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
    setEditing(false);
  };

  // ── Student card upload ───────────────────────────────────────────────────
  const handleCardFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Image must be under 5 MB"); return; }

    const reader = new FileReader();
    reader.onload = () => setCardPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingCard(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await authApi.uploadStudentCard(fd);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Student card uploaded — awaiting admin review");
    } catch {
      toast.error("Upload failed. Please try again.");
      setCardPreview(null);
    } finally {
      setUploadingCard(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  if (!user) return null;

  const vStatus    = user.studentVerificationStatus;
  const recentOrders = orders.slice(0, 3);
  const initial    = (user.name?.charAt(0) ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-8 shadow-xl shadow-blue-900/20">
          {/* decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative flex items-center gap-5 flex-wrap">
            {/* Avatar */}
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-black flex-shrink-0 backdrop-blur-sm shadow-lg">
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate">{user.name}</h1>
                {vStatus && vStatus !== "none" && <VerificationBadge status={vStatus} />}
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/30 border border-purple-300/30 text-purple-100 text-[11px] font-bold">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-blue-200 text-sm truncate">{user.email}</p>
              <p className="text-blue-300/70 text-xs mt-0.5">
                Member since {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Stats strip */}
          <div className="relative mt-5 flex gap-4 flex-wrap">
            {[
              { label: "Orders", value: orders.length },
              { label: "Wishlist", value: "—" },
              { label: "Status", value: user.isActive ? "Active" : "Inactive" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <p className="text-[10px] text-blue-200 font-medium">{label}</p>
                <p className="text-white font-black text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Left (2 cols) ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal info */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" /> Personal Information
                </h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                      {saveMutation.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Save className="w-3 h-3" />}
                      {saveMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Full Name" value={form.name} editing={editing}
                  onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Email Address" value={user.email} editing={editing} readOnly />
                <Field label="Phone Number" value={form.phone} editing={editing}
                  onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+855 12 345 678" />
                <div className="sm:col-span-2">
                  <Field label="Delivery Address" value={form.address} editing={editing}
                    onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Street, City, Province" />
                </div>
              </div>
            </div>

            {/* Student ID card — only if user.isStudent is true */}
            {user.isStudent && (
              <div className={`rounded-2xl bg-white border shadow-sm p-6 ${
                vStatus === "approved" ? "border-green-200" :
                vStatus === "rejected" ? "border-red-200"   :
                vStatus === "pending"  ? "border-amber-200" :
                "border-gray-100"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-blue-600" /> Student ID Card
                  </h2>
                  {vStatus && vStatus !== "none" && <VerificationBadge status={vStatus} />}
                </div>

                {/* Status message */}
                <div className={`text-xs font-medium leading-relaxed px-3.5 py-3 rounded-xl mb-4 ${
                  vStatus === "approved" ? "bg-green-50 text-green-700 border border-green-100" :
                  vStatus === "pending"  ? "bg-amber-50 text-amber-700 border border-amber-100" :
                  vStatus === "rejected" ? "bg-red-50 text-red-600 border border-red-100" :
                  "bg-gray-50 text-gray-500 border border-gray-100"
                }`}>
                  {vStatus === "approved" && "✅ Verified — you automatically receive 5% student discount at checkout."}
                  {vStatus === "pending"  && "⏳ Your ID card is under review. Admin will approve within 1–2 business days."}
                  {vStatus === "rejected" && "❌ Your card was rejected. Please re-upload a clearer photo of your student ID."}
                  {(!vStatus || vStatus === "none") && "📋 Upload your student ID card to receive a 5% discount on all orders."}
                </div>

                {/* Card preview */}
                {(user.studentCardUrl || cardPreview) && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {cardPreview ? "New card preview" : "Submitted card"}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cardPreview ?? user.studentCardUrl!}
                      alt="Student ID card"
                      className="w-full max-h-44 object-contain rounded-xl border border-gray-100 bg-gray-50"
                    />
                  </div>
                )}

                {/* Upload button — always show for students */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCard}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${
                    uploadingCard
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                >
                  {uploadingCard
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><Upload className="w-4 h-4" /> {user.studentCardUrl ? "Re-upload Student Card" : "Upload Student Card"}</>}
                </button>
                <p className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                  <ImageIcon className="w-3 h-3 flex-shrink-0" />
                  RUPP, NPIC, ITC, Norton, AUPP and other accredited Cambodian universities · JPG, PNG, WEBP · max 5 MB
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCardFile} className="hidden" />
              </div>
            )}

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-blue-600" /> Recent Orders
                  </h2>
                  <Link href="/orders"
                    className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {recentOrders.map(order => {
                    const style = ORDER_STATUS_STYLE[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200";
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`}
                        className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${style}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-black text-gray-900">
                            ${Number(order.total ?? 0).toFixed(2)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right (1 col) ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Quick links */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-3">Quick Links</h2>
              <div className="space-y-1">
                {[
                  { href: "/orders",   icon: ShoppingBag, label: "My Orders",       count: orders.length || undefined },
                  { href: "/wishlist", icon: Heart,       label: "Wishlist" },
                  { href: "/products", icon: Package,     label: "Browse Products" },
                  ...(user.role === "admin"
                    ? [{ href: "/admin", icon: Shield, label: "Admin Panel" }]
                    : []),
                ].map(({ href, icon: Icon, label, count }: any) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="flex-1">{label}</span>
                    {count !== undefined && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{count}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Account details */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> Account Details
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Role",    value: user.role === "admin" ? "Admin" : "Customer",
                    badge: user.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: "Status",  value: "Active",
                    badge: "bg-green-50 text-green-700 border-green-200" },
                ].map(({ label, value, badge }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${badge}`}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Total Orders</span>
                  <span className="text-gray-700 font-bold">{orders.length}</span>
                </div>
                {user.createdAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Member since</span>
                    <span className="text-gray-700 font-semibold">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sign out */}
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-100 bg-white text-red-500 text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}