"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Loader2, Zap, Shield,
  Truck, Star, AlertCircle, Mail, CheckCircle, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

const STATS = [
  { value: "2,000+", label: "Products" },
  { value: "10K+",   label: "Customers" },
  { value: "4.9★",   label: "Rating" },
];

const FEATURES = [
  { icon: Shield, text: "Genuine products, always" },
  { icon: Truck,  text: "Fast delivery across Cambodia" },
  { icon: Star,   text: "Student discounts available" },
  { icon: Zap,    text: "Pay with Bakong KHQR" },
];

// ─── Forgot password modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "";
      const status = err?.response?.status ?? 0;
      if (status === 404 || msg.toLowerCase().includes("not found")) {
        setError("No account found with this email address.");
      } else {
        // Always show success even on error to avoid email enumeration
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {!sent ? (
          <>
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-1.5">Forgot password?</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Enter the email address on your account and we'll send you a reset link.
            </p>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Mail className="w-4 h-4" /> Send Reset Link</>}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl border-2 border-gray-100 text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Back to Sign In
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Check your inbox</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-1">
              If an account exists for
            </p>
            <p className="text-sm font-bold text-gray-700 mb-3">{email}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-7">
              you'll receive a password reset link shortly. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [formError,        setFormError]        = useState<string | null>(null);
  const [showForgot,       setShowForgot]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const msg: string    = err?.response?.data?.message ?? "";
      const status: number = err?.response?.status ?? 0;
      if (status === 401 || status === 400 ||
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("credentials")) {
        setFormError("Invalid email or password. Please try again.");
      } else if (status === 404 || msg.toLowerCase().includes("not found")) {
        setFormError("No account found with this email. Create one below.");
      } else {
        setFormError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all";

  return (
    <>
      <div className="min-h-screen flex bg-gray-950">

        {/* ── Left panel ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/40 to-gray-950" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tight">
                TechStore<span className="text-blue-400">KH</span>
              </span>
              <p className="text-[10px] text-gray-500 -mt-0.5 font-medium tracking-widest uppercase">Cambodia's Tech Store</p>
            </div>
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Phnom Penh, Cambodia
            </div>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Your trusted<br />
              <span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">tech partner</span><br />
              in Cambodia.
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm mb-10">
              Genuine products, fast delivery, and honest service — built for Cambodians, by Cambodians.
            </p>
            <div className="flex gap-6 mb-10">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-gray-600 font-medium">© 2026 TechStore KH. All rights reserved.</p>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-xl text-gray-900">TechStore<span className="text-blue-600">KH</span></span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Welcome back</h2>
              <p className="text-gray-400 text-sm">Sign in to your account to continue shopping</p>
            </div>

            {/* Inline error banner */}
            {formError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 mb-5">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">{formError}</p>
                  {formError.includes("No account") && (
                    <Link href="/auth/register"
                      className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-flex items-center gap-1">
                      Create an account <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {formError.includes("Invalid email or password") && (
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-blue-600 font-bold hover:underline mt-1 flex items-center gap-1"
                    >
                      Forgot your password? <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setFormError(null); }}
                  placeholder="you@example.com" required
                  className={inputCls}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFormError(null); }}
                    placeholder="Enter your password"
                    required
                    className={`${inputCls} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Don't have an account?</p>
              <Link href="/auth/register"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all">
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}