"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Package, ChevronRight, Clock, CheckCircle2, Truck, ShoppingBag,
  XCircle, RefreshCw, Sparkles, ArrowRight,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType;
}> = {
  pending:    { label: "Pending",    color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  icon: Clock },
  confirmed:  { label: "Confirmed",  color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",   icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200", icon: RefreshCw },
  shipped:    { label: "Shipped",    color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-200",   icon: Truck },
  delivered:  { label: "Delivered",  color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",    icon: XCircle },
  refunded:   { label: "Refunded",   color: "text-gray-500",    bg: "bg-gray-100",   border: "border-gray-200",   icon: RefreshCw },
};

const PAYMENT_COLOR: Record<string, string> = {
  pending:  "text-amber-600",
  paid:     "text-green-600",
  failed:   "text-red-500",
  refunded: "text-gray-500",
};

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

function MiniTracker({ status }: { status: string }) {
  const currentStep = STATUS_STEPS.indexOf(status as OrderStatus);
  if (currentStep === -1) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
            i < currentStep ? "bg-green-500" :
            i === currentStep ? "bg-blue-600 ring-2 ring-blue-200" :
            "bg-gray-200"
          }`} />
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-0.5 rounded ${i < currentStep ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  });

  const orders: Order[] = ordersData ?? [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-gray-100 bg-white p-5 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-gray-100 rounded mb-3" />
              <div className="flex gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex-1 h-2 bg-gray-100 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-8">Start shopping to track your orders here</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.map((order) => {
          const navId = order.id;
          const displayTotal = Number(order.total ?? 0);
          const statusCfg = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
          const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const isCancelled = order.status === "cancelled" || order.status === "refunded";
          const payColor = PAYMENT_COLOR[order.paymentStatus ?? "pending"] ?? "text-gray-500";
          const payLabel = (order.paymentStatus ?? "pending");

          return (
            <Link
              key={navId}
              href={`/orders/${navId}`}
              className="block group"
            >
              <div className={`rounded-2xl border-2 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 ${cfg.border}`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-gray-900">#{order.orderNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className={`text-xs font-semibold capitalize ${payColor}`}>
                        {payLabel.charAt(0).toUpperCase() + payLabel.slice(1)}
                      </span>
                    </div>

                    {/* Date & payment method */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span>
                        {order.paymentMethod === "bakong_khqr"
                          ? "Bakong KHQR"
                          : order.paymentMethod === "cash_on_delivery"
                          ? "Cash on Delivery"
                          : order.paymentMethod}
                      </span>
                      {order.items && order.items.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price & arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-lg text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                      ${displayTotal.toFixed(2)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Mini product images if available */}
                {order.items && order.items.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress tracker */}
                {!isCancelled && <MiniTracker status={order.status} />}

                {isCancelled && (
                  <div className="mt-3 text-xs text-red-400 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    This order was {order.status}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Keep STATUS_STYLES for backwards compat reference
const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-600",
  confirmed:  "bg-blue-100 text-blue-600",
  processing: "bg-purple-100 text-purple-600",
  shipped:    "bg-cyan-500/20 text-cyan-400",
  delivered:  "bg-green-100 text-green-600",
  cancelled:  "bg-red-100 text-red-600",
  refunded:   "bg-gray-100 text-gray-500",
};