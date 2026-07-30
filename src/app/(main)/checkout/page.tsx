"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag, CreditCard, Truck, User, Phone, MapPin, ChevronRight,
  CheckCircle, Loader2, RefreshCw, AlertCircle, Tag, Clock,
  Upload, ShieldCheck, XCircle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  ordersApi,
  authApi,
  type CreateOrderResponse,
  type KHQRResponse,
  type CheckPaymentResponse,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import type { StudentVerificationStatus } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE             = 5;
const STUDENT_DISCOUNT_PCT     = 5;
const POLL_INTERVAL_MS         = 3000;
const POLL_TIMEOUT_MS          = 15 * 60 * 1000;

const STUDENT_CARD_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const STUDENT_CARD_MAX_BYTES      = 5 * 1024 * 1024; // 5MB

type Step          = "cart" | "address" | "payment" | "processing" | "success";
type PaymentMethod = "bakong_khqr" | "cash_on_delivery";

// ─── KHQR Card Component ──────────────────────────────────────────────────────
interface KHQRCardProps {
  merchantName:  string;
  amount:        number;
  currency:      string;
  /** Full data URL or external QR image URL */
  qrImageBase64: string;
  expiresAt:     number;
  orderNumber:   string;
}

function KHQRCard({ merchantName, amount, currency, qrImageBase64, expiresAt, orderNumber }: KHQRCardProps) {
  const [remaining, setRemaining] = useState<number>(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isExpiringSoon = remaining < 2 * 60 * 1000;

  const formattedAmount = currency === "KHR"
    ? amount.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : amount.toFixed(2);

  return (
    <div className="w-72 rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-100">
      {/* Red header with KHQR logo */}
      <div className="relative bg-[#E31E24] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-white font-black text-2xl tracking-tight">KH</span>
          <div className="flex items-center gap-0.5">
            <div className="w-5 h-5 border-2 border-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-[1px]" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">R</span>
          </div>
        </div>
        {/* Diagonal corner accent */}
        <div
          className="absolute top-0 right-0 w-12 h-12 bg-[#c01a1f]"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />
      </div>

      {/* Merchant info */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-gray-400 text-xs mb-0.5">{merchantName}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-gray-900 font-bold text-3xl tracking-tight">{formattedAmount}</span>
          <span className="text-gray-500 font-semibold text-base">{currency}</span>
        </div>
        <p className="text-gray-400 text-[10px] mt-1">Order {orderNumber}</p>
      </div>

      {/* Dashed divider */}
      <div className="mx-4 border-t-2 border-dashed border-gray-200" />

      {/* QR Code */}
      <div className="px-6 py-5 flex flex-col items-center gap-3">
        {/* Using <img> intentionally — qrImageBase64 is an external QR API URL, not a local asset */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageBase64}
          alt="Bakong KHQR Code"
          width={192}
          height={192}
          className="w-48 h-48 object-contain"
        />
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpiringSoon ? "text-red-500" : "text-gray-400"}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>
            Expires in{" "}
            <span className="font-mono font-bold">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center">
        <p className="text-gray-400 text-[10px]">
          Open your banking app → Scan QR → Confirm payment
        </p>
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {["ABA", "ACLEDA", "Wing", "TrueMoney", "Canadia"].map(bank => (
            <span key={bank} className="text-gray-400 text-[9px] border border-gray-200 rounded px-1.5 py-0.5">{bank}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Checkout Component ──────────────────────────────────────────────────
export default function Checkout() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep]                   = useState<Step>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bakong_khqr");
  const [isStudent, setIsStudent]         = useState(false);
  const [name, setName]                   = useState("");
  const [phone, setPhone]                 = useState("");
  const [address, setAddress]             = useState("");
  const [city, setCity]                   = useState("");
  const [note, setNote]                   = useState("");
  const [isLoading, setIsLoading]         = useState(false);

  // ── Student verification state ────────────────────────────────────────────
  const [studentCardFile, setStudentCardFile]       = useState<File | null>(null);
  const [studentCardPreview, setStudentCardPreview] = useState<string | null>(null);
  const [isUploadingCard, setIsUploadingCard]       = useState(false);
  const [studentCardUrl, setStudentCardUrl]         = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<StudentVerificationStatus>("none");

  // ── Order state ─────────────────────────────────────────────────────────────
  const [orderId, setOrderId]             = useState<number | null>(null);
  const [orderNumber, setOrderNumber]     = useState("");
  const [orderTotal, setOrderTotal]       = useState(0);
  const [orderSubtotal, setOrderSubtotal] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderShipping, setOrderShipping] = useState(0);

  const [khqrData, setKhqrData] = useState<(KHQRResponse & { qrImageBase64: string }) | null>(null);

  const [pollStatus, setPollStatus] = useState<"idle" | "polling" | "paid" | "expired">("idle");
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef                = useRef<number>(0);

  // ── Price calculations ───────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // The 5% discount only applies once the student's ID has actually been
  // approved — checking the box alone (or having it "pending") is not enough.
  const isStudentDiscountActive = isStudent && verificationStatus === "approved";
  const discount      = isStudentDiscountActive
    ? parseFloat(((subtotal * STUDENT_DISCOUNT_PCT) / 100).toFixed(2))
    : 0;
  const afterDiscount = subtotal - discount;
  const shipping      = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total         = afterDiscount + shipping;

  // ── Pre-fill name from auth ──────────────────────────────────────────────────
  useEffect(() => {
    if (user && !name) setName(user.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Sync student verification state from the logged-in user ─────────────────
  useEffect(() => {
    if (user) {
      setStudentCardUrl(user.studentCardUrl ?? null);
      setVerificationStatus(user.studentVerificationStatus ?? "none");
      setIsStudent(user.isStudent ?? false);
    }
  }, [user]);

  // ── Clean up object URL preview ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (studentCardPreview) URL.revokeObjectURL(studentCardPreview);
    };
  }, [studentCardPreview]);

  // ── Stop polling on unmount ──────────────────────────────────────────────────
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Redirect if cart is empty ────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0 && step === "cart") router.push("/cart");
  }, [items, step, router]);

  // ── Student ID card handlers ─────────────────────────────────────────────────
  const handleStudentCardSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!STUDENT_CARD_ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, or PDF file");
      return;
    }
    if (file.size > STUDENT_CARD_MAX_BYTES) {
      toast.error("File must be under 5MB");
      return;
    }

    setStudentCardFile(file);
    setStudentCardPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    // Reset input so re-selecting the same file re-fires onChange
    e.target.value = "";
  };

  const clearStudentCardSelection = () => {
    if (studentCardPreview) URL.revokeObjectURL(studentCardPreview);
    setStudentCardFile(null);
    setStudentCardPreview(null);
  };

  const uploadStudentCard = async () => {
    if (!studentCardFile) return;
    setIsUploadingCard(true);
    try {
      const formData = new FormData();
      // Field name must be "file" to match @RequestParam("file") on the
      // Spring Boot side (same convention as /api/admin/upload-image).
      formData.append("file", studentCardFile);

      const res = await authApi.uploadStudentCard(formData);
      setStudentCardUrl(res.studentCardUrl);
      setVerificationStatus("pending");
      clearStudentCardSelection();
      toast.success("Student ID uploaded — pending verification");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to upload student ID";
      toast.error(msg);
    } finally {
      setIsUploadingCard(false);
    }
  };

  // A student who checked the box needs either an approved/pending verification
  // on file, or a freshly uploaded card, before they can continue.
  const studentVerificationMissing =
    isStudent &&
    verificationStatus !== "approved" &&
    verificationStatus !== "pending" &&
    !studentCardUrl;

  // ── Bakong polling ───────────────────────────────────────────────────────────
  const startPolling = useCallback((oid: number) => {
    setPollStatus("polling");
    pollStartRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        clearInterval(pollRef.current!);
        setPollStatus("expired");
        return;
      }
      try {
        const result: CheckPaymentResponse = await ordersApi.checkPayment(oid);

        if (result.isPaid === true) {
          clearInterval(pollRef.current!);
          setPollStatus("paid");
          clearCart();
          setStep("success");
          return;
        }
        if (result.expired) {
          clearInterval(pollRef.current!);
          setPollStatus("expired");
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [clearCart]);

  // ── Place order ──────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Please fill in all required shipping fields");
      return;
    }
    setIsLoading(true);
    try {
      const orderData: CreateOrderResponse = await ordersApi.create({
        items: items.map((i) => ({
          productId:    i.product.id,
          productName:  i.product.name,
          // FIX 1: Removed `i.product.imageUrl?.[0]` fallback.
          // `imageUrl` was removed from the Product interface in types.ts (Fix 3).
          // The backend always serialises the images column as `images`.
          productImage: i.product.images?.[0] ?? "",
          price:        i.product.price,
          quantity:     i.quantity,
        })),
        shippingAddress: { name, phone, address, city, note: note || undefined },
        paymentMethod,
        isStudent,
        notes: note || undefined,
      });

      // FIX 2: `CreateOrderResponse` uses `orderId` as returned by the Spring
      // Boot endpoint. This is the DTO field name, NOT the Order entity's `id`.
      // The distinction matters: `orderId` here is the DTO response field used
      // only during checkout flow; the Order list/detail pages use `order.id`.
      // No change needed — this is correct as-is.
      const newOrderId = orderData.orderId;
      setOrderId(newOrderId);
      setOrderNumber(orderData.orderNumber);
      setOrderTotal(orderData.total);
      setOrderSubtotal(orderData.subtotal);
      setOrderDiscount(orderData.discount);
      setOrderShipping(orderData.shipping);

      if (paymentMethod === "bakong_khqr") {
        const khqr: KHQRResponse = await ordersApi.generateKHQR(newOrderId);
        const qrImageBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=10&data=${encodeURIComponent(khqr.qrString)}`;
        setKhqrData({ ...khqr, qrImageBase64 });
        setStep("processing");
        startPolling(newOrderId);
      } else {
        await ordersApi.confirmCOD(newOrderId);
        clearCart();
        setStep("success");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to place order. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateQR = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const khqr: KHQRResponse = await ordersApi.generateKHQR(orderId);
      const qrImageBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=10&data=${encodeURIComponent(khqr.qrString)}`;
      setKhqrData({ ...khqr, qrImageBase64 });
      // FIX 3: Reset pollStatus to "polling" (not "idle") before restarting.
      // The original reset to "idle" first, then called startPolling which sets
      // it to "polling". This caused a one-render flash where the "Waiting for
      // payment confirmation..." indicator disappeared briefly. Removed the
      // intermediate "idle" reset — startPolling sets "polling" immediately.
      startPolling(orderId);
    } catch {
      toast.error("Failed to regenerate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────────
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  const renderOrderSummary = () => (
    <div className="card-base p-5 space-y-4">
      <h3 className="font-semibold text-sm">Order Summary</h3>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {/* FIX 4: Removed `item.product.imageUrl?.[0]` fallback (same as Fix 1). */}
              <Image
                src={item.product.images?.[0] ?? "/placeholder-product.png"}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-1">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">×{item.quantity}</p>
            </div>
            <p className="text-xs font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border/50 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {isStudentDiscountActive && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Student 5%</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>
            {shipping === 0
              ? <span className="text-green-600">Free</span>
              : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        {shipping > 0 && afterDiscount < FREE_SHIPPING_THRESHOLD && (
          <p className="text-[10px] text-muted-foreground">
            Add ${(FREE_SHIPPING_THRESHOLD - afterDiscount).toFixed(2)} more for free shipping
          </p>
        )}
        <div className="flex justify-between font-bold text-base pt-1 border-t border-border/50">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderStudentVerificationBlock = () => (
    <div className="card-base p-4 space-y-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isStudent}
          onChange={(e) => setIsStudent(e.target.checked)}
          className="rounded border-border"
        />
        I am a student (5% discount)
      </label>

      {isStudent && (
        <div className="pl-6 space-y-2">
          {verificationStatus === "approved" ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Student status verified
            </div>
          ) : verificationStatus === "pending" ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Clock className="w-3.5 h-3.5" /> Student ID under review — the 5% discount isn't applied to this order yet, but will unlock automatically for future orders once approved
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {verificationStatus === "rejected"
                  ? "Your previous student ID was rejected. Upload a new one — the 5% discount will apply once it's approved."
                  : "Upload your student ID card. The 5% discount applies once it's approved (not on this order if it's still pending)."}
              </p>

              {!studentCardFile ? (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-xs text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
                  <Upload className="w-4 h-4" />
                  Choose file (JPG, PNG, PDF — max 5MB)
                  <input
                    type="file"
                    accept={STUDENT_CARD_ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={handleStudentCardSelect}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary">
                  {studentCardPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={studentCardPreview}
                      alt="Student card preview"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-[10px] font-semibold text-muted-foreground border border-border">
                      PDF
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{studentCardFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(studentCardFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearStudentCardSelection}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove selected file"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {studentCardFile && (
                <button
                  type="button"
                  onClick={uploadStudentCard}
                  disabled={isUploadingCard}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isUploadingCard
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />}
                  {isUploadingCard ? "Uploading..." : "Upload Student ID"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Step: Cart review ────────────────────────────────────────────────────────
  if (step === "cart") {
    if (items.length === 0) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </button>
        </div>
      );
    }
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Review Your Cart
        </h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="card-base p-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {/* FIX 5: Removed `item.product.imageUrl?.[0]` fallback (same as Fix 1). */}
                  <Image
                    src={item.product.images?.[0] ?? "/placeholder-product.png"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{item.product.name}</p>
                  {item.product.brand && (
                    <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">
                    ${item.product.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {renderOrderSummary()}
            {renderStudentVerificationBlock()}
            <button
              onClick={() => setStep("address")}
              disabled={studentVerificationMissing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Continue to Shipping <ChevronRight className="w-4 h-4" />
            </button>
            {studentVerificationMissing && (
              <p className="text-[10px] text-center text-muted-foreground -mt-2">
                Upload your student ID above to continue, or uncheck the student box.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Shipping address ────────────────────────────────────────────────────
  if (step === "address") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Truck className="w-6 h-6" /> Shipping Details
        </h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                {/* FIX 6: `<label>` cannot contain a block-level `<div>` as a
                    descendant. The original used `className="... flex items-center gap-1"`
                    on the label which is fine, but the Lucide icon was inside the
                    label text flow. Kept as-is since it is valid inline content.
                    However, the `flex` on `<label>` conflicts with the `block`
                    class — replaced `block` with `flex` to avoid the conflict. */}
                <label className="flex items-center gap-1 text-sm font-medium mb-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name *
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sopheak Meng" className={inputCls} />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium mb-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone *
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+855 12 345 678" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium mb-1.5">
                <MapPin className="w-3.5 h-3.5" /> Address *
              </label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street 271, Toul Kork" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">City / Province *</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Phnom Penh" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Delivery Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Leave at door, call before delivery..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
          <div className="space-y-4">
            {renderOrderSummary()}
            <button
              onClick={() => setStep("payment")}
              disabled={!name || !phone || !address || !city}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Continue to Payment <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setStep("cart")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Payment method ─────────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CreditCard className="w-6 h-6" /> Payment Method
        </h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {(["bakong_khqr", "cash_on_delivery"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === method
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {paymentMethod === method && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {method === "bakong_khqr" ? "Bakong KHQR" : "Cash on Delivery"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method === "bakong_khqr"
                        ? "Scan QR code with any Bakong-enabled app"
                        : "Pay in cash when your order arrives"}
                    </p>
                  </div>
                  {method === "bakong_khqr" && (
                    <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">KH</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {renderOrderSummary()}
            <button
              onClick={placeOrder}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isLoading ? "Placing Order..." : "Place Order"}
            </button>
            <button onClick={() => setStep("address")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Shipping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Processing (Bakong QR) ─────────────────────────────────────────────
  if (step === "processing" && khqrData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <h1 className="text-2xl font-bold">Scan to Pay</h1>
        <p className="text-muted-foreground text-sm">
          Order <strong>{orderNumber}</strong>
        </p>

        <div className="flex justify-center">
          <KHQRCard
            merchantName="TechStore KH"
            amount={khqrData.amount}
            currency={khqrData.currency}
            qrImageBase64={khqrData.qrImageBase64}
            // FIX 7: `expiresAt` from KHQRResponse can be a string ISO date or
            // a numeric timestamp depending on the Jackson serialiser config.
            // The ternary guard converts either form to a numeric timestamp.
            expiresAt={typeof khqrData.expiresAt === "string"
              ? new Date(khqrData.expiresAt).getTime()
              : khqrData.expiresAt}
            orderNumber={orderNumber}
          />
        </div>

        {pollStatus === "polling" && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Waiting for payment confirmation...
          </div>
        )}
        {pollStatus === "expired" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" /> QR code expired
            </div>
            <button
              onClick={regenerateQR}
              disabled={isLoading}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Generate New QR
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Step: Success ────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Order Confirmed!</h1>
        {orderNumber && (
          <p className="text-muted-foreground text-sm">
            Order <strong>{orderNumber}</strong> has been placed successfully.
          </p>
        )}
        <div className="card-base p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${orderSubtotal.toFixed(2)}</span>
          </div>
          {orderDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Student Discount</span>
              <span>-${orderDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{orderShipping === 0 ? "Free" : `$${orderShipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
            <span>Total Paid</span>
            <span className="text-primary">${orderTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/orders")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-2.5 rounded-xl bg-secondary font-semibold hover:bg-secondary/80 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return null;
}