"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, ChevronRight, Clock, CheckCircle2, Truck, ShoppingBag,
  XCircle, RefreshCw, ArrowRight, Ban, Loader2, X, Sparkles,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import toast from "react-hot-toast";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400",  icon: Clock },
  confirmed:  { label: "Confirmed",  color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",   icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500", icon: RefreshCw },
  shipped:    { label: "Shipped",    color: "text-cyan-700",   bg: "bg-cyan-50",    border: "border-cyan-200",   dot: "bg-cyan-500",   icon: Truck },
  delivered:  { label: "Delivered",  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",  icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-400",    icon: XCircle },
  refunded:   { label: "Refunded",   color: "text-gray-500",   bg: "bg-gray-100",   border: "border-gray-200",   dot: "bg-gray-400",   icon: RefreshCw },
};

const PAY_COLOR: Record<string, string> = {
  pending: "text-amber-600", paid: "text-green-600",
  failed:  "text-red-500",   refunded: "text-gray-400",
};

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];
const CANCELLABLE = new Set(["pending", "confirmed"]);

// ─── Mini progress tracker ─────────────────────────────────────────────────────
function MiniTracker({ status }: { status: string }) {
  const step = STATUS_STEPS.indexOf(status as OrderStatus);
  if (step === -1) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
            i < step  ? "bg-green-500" :
            i === step ? "bg-blue-600 ring-2 ring-blue-100" :
            "bg-gray-200"
          }`} />
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-[2px] mx-0.5 rounded-full ${i < step ? "bg-green-400" : "bg-gray-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Cancel modal ──────────────────────────────────────────────────────────────
function CancelModal({ orderNumber, isPending, onConfirm, onClose }: {
  orderNumber: string; isPending: boolean;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Ban className="w-4.5 h-4.5 text-red-500" />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <h3 className="font-bold text-base text-gray-900 mb-1">Cancel order #{orderNumber}?</h3>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          This can't be undone. Paid orders will be refunded within 3–5 business days.
        </p>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={300}
          placeholder="e.g. Changed my mind, found a better price…"
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-red-200 focus:bg-white resize-none transition-colors" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
            Keep Order
          </button>
          <button onClick={() => onConfirm(reason)} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {isPending ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const qc = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn:  ordersApi.list,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      ordersApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["orders"] });
      setCancelTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Couldn't cancel order. Contact support.");
    },
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-36 bg-gray-100 rounded-xl animate-pulse mb-6" />
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 p-5 animate-pulse space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-48 bg-gray-50 rounded" />
            <div className="flex gap-1 mt-2">{[...Array(5)].map((_, j) => <div key={j} className="flex-1 h-2 bg-gray-100 rounded-full" />)}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!orders.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-10 h-10 text-blue-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">No orders yet</h2>
        <p className="text-sm text-gray-400 mb-7">Your orders will appear here once you shop</p>
        <Link href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105">
          <Sparkles className="w-4 h-4" /> Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // ── List ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
            <p className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {orders.map(order => {
            const cfg        = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
            const Icon       = cfg.icon;
            const isCancelled = order.status === "cancelled" || order.status === "refunded";
            const canCancel  = CANCELLABLE.has(order.status);
            const payColor   = PAY_COLOR[order.paymentStatus ?? "pending"] ?? "text-gray-400";
            const total      = Number(order.total ?? 0);

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden">

                {/* Status accent bar */}
                <div className={`h-1 ${cfg.dot}`} />

                <div className="p-5">
                  {/* Top row */}
                  <Link href={`/orders/${order.id}`} className="flex items-start justify-between gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm text-gray-900">#{order.orderNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                        <span className={`text-[11px] font-semibold capitalize ${payColor}`}>
                          {(order.paymentStatus ?? "pending")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>·</span>
                        <span>{order.paymentMethod === "bakong_khqr" ? "KHQR" : "COD"}</span>
                        {order.items?.length ? <><span>·</span><span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span></> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-black text-lg text-gray-900">${total.toFixed(2)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>

                  {/* Product thumbnails */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3">
                      {order.items.slice(0, 5).map((item, i) => (
                        <div key={i} className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                          {item.productImage
                            ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-3.5 h-3.5 text-gray-300" /></div>}
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                          +{order.items.length - 5}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress tracker */}
                  {!isCancelled && <MiniTracker status={order.status} />}

                  {/* Cancelled reason */}
                  {isCancelled && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="capitalize">{order.status}</span>
                      {order.cancelReason && <span className="text-gray-400">· {order.cancelReason}</span>}
                    </div>
                  )}

                  {/* Cancel button */}
                  {canCancel && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => setCancelTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          orderNumber={cancelTarget.orderNumber}
          isPending={cancelMutation.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={reason => cancelMutation.mutate({ id: cancelTarget.id, reason: reason || undefined })}
        />
      )}
    </div>
  );
}