"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Eye, ChevronLeft, ChevronRight, X,
  Package, Clock, CheckCircle, Truck, XCircle,
  ShoppingBag, MapPin, CreditCard, StickyNote,
  Receipt, Tag, Trash2, AlertTriangle,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Order, OrderItem, ShippingAddress } from "@/types";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; icon: React.ElementType }> = {
  pending:    { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200",  dot: "bg-yellow-400",  icon: Clock       },
  confirmed:  { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400",    icon: CheckCircle  },
  processing: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  dot: "bg-purple-400",  icon: Package     },
  shipped:    { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200",    dot: "bg-cyan-400",    icon: Truck       },
  delivered:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400", icon: CheckCircle  },
  cancelled:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400",     icon: XCircle     },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string }> = {
  paid:     { bg: "bg-emerald-50", text: "text-emerald-700" },
  pending:  { bg: "bg-yellow-50",  text: "text-yellow-700"  },
  failed:   { bg: "bg-red-50",     text: "text-red-700"     },
  refunded: { bg: "bg-zinc-100",   text: "text-zinc-600"    },
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-200", dot: "bg-zinc-300", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cap(status)}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const cfg = PAYMENT_CONFIG[status ?? "pending"] ?? { bg: "bg-zinc-100", text: "text-zinc-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cap(status ?? "pending")}
    </span>
  );
}

// ─── Clear Confirm Modal ──────────────────────────────────────────────────────

function ClearConfirmModal({
  statusFilter,
  total,
  isPending,
  onConfirm,
  onCancel,
}: {
  statusFilter: string;
  total: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const confirmWord = "CANCEL";
  const ready = typed === confirmWord;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !isPending && onCancel()}
    >
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-red-900">Clear All Orders</h2>
            <p className="text-xs text-red-500 mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-600 leading-relaxed">
            You are about to <span className="font-bold text-red-600">cancel all {total.toLocaleString()}</span>{" "}
            {statusFilter ? <><span className="font-semibold">"{statusFilter}"</span> </> : ""}
            orders. All affected orders will be marked as <span className="font-semibold">cancelled</span>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
            ⚠️ This will update all orders matching your current filter, not just this page.
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Type <span className="text-red-600 font-black">{confirmWord}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmWord}
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm font-mono font-bold tracking-widest disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!ready || isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Cancel All Orders
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const addr = order.shippingAddress as ShippingAddress | Record<string, string> | undefined;
  const total    = Number(order.total    ?? 0);
  const shipping = Number(order.shipping ?? 0);
  const discount = Number(order.discount ?? 0);
  const subtotal = Number(order.subtotal ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl shadow-zinc-300/50 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Order #{order.orderNumber ?? order.id}</h2>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Status row */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus ?? "pending"} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
              <CreditCard className="w-3 h-3" />
              {order.paymentMethod === "bakong_khqr" ? "Bakong KHQR" : "Cash on Delivery"}
            </span>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Items ({order.items.length})
              </p>
              <div className="space-y-2">
                {order.items.map((item: OrderItem) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    {item.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${Number(item.price).toFixed(2)} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Price Breakdown
            </p>
            <div className="px-4 pb-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-emerald-600 font-semibold">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {addr && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Shipping Address
              </p>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm space-y-1.5">
                <p className="font-semibold">{addr.name}</p>
                {addr.phone   && <p className="text-muted-foreground">{addr.phone}</p>}
                {addr.address && <p className="text-muted-foreground">{addr.address}</p>}
                {addr.city    && <p className="text-muted-foreground">{addr.city}</p>}
                {addr.note    && <p className="text-muted-foreground italic border-t border-zinc-200 pt-1.5 mt-1.5">Note: {addr.note}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Order Notes
              </p>
              <p className="text-sm text-muted-foreground bg-zinc-50 border border-zinc-100 rounded-xl p-4 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("");
  const [page,            setPage]            = useState(1);
  const [viewing,         setViewing]         = useState<Order | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page, search, statusFilter],
    queryFn: () =>
      adminApi.orders.list({
        page,
        limit:  20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.orders.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  // Cancel all orders matching the current status filter, paginated
  const clearAll = useMutation({
    mutationFn: async () => {
      let p = 1;
      while (true) {
        const res = await adminApi.orders.list({
          page: p,
          limit: 50,
          status: statusFilter || undefined,
        });
        const batch: Order[] = res.items ?? [];
        if (batch.length === 0) break;
        await Promise.all(
          batch
            .filter((o) => o.status !== "cancelled")
            .map((o) => adminApi.orders.updateStatus(o.id, { status: "cancelled" }))
        );
        if (batch.length < 50) break;
        p++;
      }
    },
    onSuccess: () => {
      toast.success(
        statusFilter
          ? `All "${statusFilter}" orders cancelled`
          : "All orders cancelled"
      );
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      setShowClearConfirm(false);
    },
    onError: () => {
      toast.error("Failed to clear orders");
      setShowClearConfirm(false);
    },
  });

  const orders: Order[] = data?.items ?? [];
  const total            = data?.total ?? 0;
  const totalPages       = data?.totalPages ?? 1;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            {total.toLocaleString()} total orders
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Clear all button */}
          {total > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-sm transition-all hover:scale-[1.02]"
            >
              <Trash2 className="w-4 h-4" />
              {statusFilter ? `Clear "${cap(statusFilter)}"` : "Clear All"}
            </button>
          )}

          {/* Status filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border flex-wrap">
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === ""
                  ? "bg-white text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    statusFilter === s
                      ? `${cfg.bg} ${cfg.text} shadow-xs border ${cfg.border}`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cap(s)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order number or customer…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/40">
                {["Order", "Customer", "Date", "Total", "Payment", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                      h === "Total"   ? "text-right"  :
                      h === "Payment" ? "text-center" :
                      h === "Status"  ? "text-center" :
                      h === ""        ? ""            : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-5 bg-secondary rounded-lg animate-pulse w-24" /></td>
                    <td className="px-5 py-4"><div className="space-y-1.5"><div className="h-3.5 bg-secondary rounded-lg animate-pulse w-32" /><div className="h-3 bg-secondary rounded-lg animate-pulse w-44" /></div></td>
                    <td className="px-5 py-4"><div className="h-3.5 bg-secondary rounded-lg animate-pulse w-20" /></td>
                    <td className="px-5 py-4"><div className="h-3.5 bg-secondary rounded-lg animate-pulse w-16 ml-auto" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-secondary rounded-full animate-pulse w-16 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-secondary rounded-full animate-pulse w-24 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-8 bg-secondary rounded-lg animate-pulse w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No orders found</p>
                      {(search || statusFilter) && (
                        <button
                          onClick={() => { setSearch(""); setStatusFilter(""); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const ext = order as Order & { userName?: string; userEmail?: string };
                  return (
                    <tr key={order.id} className="hover:bg-secondary/25 transition-colors duration-150 group">
                      {/* Order number */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/8 px-2 py-1 rounded-lg whitespace-nowrap">
                          #{order.orderNumber ?? order.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-sm truncate max-w-[160px]">{ext.userName ?? "—"}</p>
                        {ext.userEmail && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{ext.userEmail}</p>}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 text-right font-bold text-sm">
                        ${Number(order.total ?? 0).toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5 text-center">
                        <PaymentBadge status={order.paymentStatus ?? "pending"} />
                      </td>

                      {/* Status dropdown */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                            disabled={updateStatus.isPending}
                            className={`appearance-none pl-7 pr-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all ${
                              STATUS_CONFIG[order.status]
                                ? `${STATUS_CONFIG[order.status].bg} ${STATUS_CONFIG[order.status].text} ${STATUS_CONFIG[order.status].border}`
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                          </select>
                          {STATUS_CONFIG[order.status] && (
                            <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${STATUS_CONFIG[order.status].dot}`} />
                          )}
                        </div>
                      </td>

                      {/* View */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewing(order)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-white hover:bg-secondary hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100"
                          title="View order details"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
              <span className="ml-1.5 text-muted-foreground/60">({total.toLocaleString()} orders)</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                      p === page
                        ? "bg-primary text-white shadow-sm shadow-primary/25"
                        : "border border-border bg-white hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {viewing && <OrderDetailModal order={viewing} onClose={() => setViewing(null)} />}

      {/* Clear all confirm modal */}
      {showClearConfirm && (
        <ClearConfirmModal
          statusFilter={statusFilter}
          total={total}
          isPending={clearAll.isPending}
          onConfirm={() => clearAll.mutate()}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}