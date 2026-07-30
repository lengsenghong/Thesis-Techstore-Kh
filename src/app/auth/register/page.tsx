"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Loader2, GraduationCap,
  Upload, X, CheckCircle, Zap, ImageIcon, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

const BENEFITS = [
  "Free shipping on orders over $100",
  "Student discounts up to 15% off",
  "Pay with Bakong KHQR",
  "12-month warranty on all products",
  "Same-day delivery in Phnom Penh",
];

const MIN_PASSWORD = 8; // matches backend: size must be between 8 and 72

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", isStudent: false });
  const [showPassword,       setShowPassword]       = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [studentCardFile,    setStudentCardFile]    = useState<File | null>(null);
  const [studentCardPreview, setStudentCardPreview] = useState<string | null>(null);
  const [uploadingCard,      setUploadingCard]      = useState(false);

  // ── Inline field errors ─────────────────────────────────────────────────
  const [emailError,    setEmailError]    = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "email")    setEmailError(null);
    if (name === "password") setPasswordError(null);
    if (name === "isStudent" && !checked) { setStudentCardFile(null); setStudentCardPreview(null); }
  };

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Image must be smaller than 5 MB"); return; }
    setStudentCardFile(file);
    const reader = new FileReader();
    reader.onload = () => setStudentCardPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCard = () => {
    setStudentCardFile(null); setStudentCardPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);

    // Client-side validation — mirrors backend constraints
    if (form.password.length < MIN_PASSWORD) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD} characters`);
      return;
    }
    if (form.isStudent && !studentCardFile) {
      toast.error("Please upload your student card");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);

      if (form.isStudent && studentCardFile) {
        setUploadingCard(true);
        try {
          const fd = new FormData();
          fd.append("file", studentCardFile);
          fd.append("isStudent", "true");
          await authApi.uploadStudentCard(fd);
          toast.success("Account created! Student card is under review.");
        } catch {
          toast.success("Account created!");
          toast.error("Student card upload failed — you can re-upload in your profile.");
        } finally {
          setUploadingCard(false);
        }
      } else {
        toast.success("Welcome to TechStore KH!");
      }
      router.push("/");

    } catch (err: any) {
      const msg: string  = err?.response?.data?.message ?? "";
      const status: number = err?.response?.status ?? 0;

      if (
        status === 409 ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("email")
      ) {
        // ── Show inline error under the email field ──────────────────────
        setEmailError("An account with this email already exists.");
      } else if (
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("size must be between")
      ) {
        setPasswordError(`Password must be at least ${MIN_PASSWORD} characters`);
      } else {
        toast.error(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || uploadingCard;

  // Password strength
  const pwLen      = form.password.length;
  const pwStrength = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : pwLen < 14 ? 3 : 4;
  const strengthMeta = [
    { color: "bg-gray-100",   label: "" },
    { color: "bg-red-400",    label: "Too short" },
    { color: "bg-amber-400",  label: "Weak" },
    { color: "bg-blue-400",   label: "Good" },
    { color: "bg-green-500",  label: "Strong" },
  ];

  const inputCls = (err: boolean) =>
    `w-full px-4 py-3.5 rounded-2xl border-2 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-300 focus:outline-none focus:bg-white focus:ring-4 transition-all ${
      err
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
        : "border-gray-100 focus:border-blue-500 focus:ring-blue-500/10"
    }`;

  return (
    <div className="min-h-screen flex bg-gray-950">

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-14">
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
            <span className="font-black text-xl text-white tracking-tight">TechStore<span className="text-blue-400">KH</span></span>
            <p className="text-[10px] text-gray-500 -mt-0.5 font-medium tracking-widest uppercase">Cambodia's Tech Store</p>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Join thousands of customers
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Start shopping<br />
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">the best tech</span><br />
            in Cambodia.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-10">
            Create your free account in seconds and unlock exclusive deals, fast delivery, and genuine products.
          </p>
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-sm text-gray-400 font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-600 font-medium">© 2024 TechStore KH. All rights reserved.</p>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 lg:px-14 overflow-y-auto">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl text-gray-900">TechStore<span className="text-blue-600">KH</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create account</h2>
            <p className="text-gray-400 text-sm">Start shopping the best tech in Cambodia</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Sopheak Meng" required className={inputCls(false)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+855 12 345 678" className={inputCls(false)} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required className={inputCls(!!emailError)} />

              {emailError && (
                <div className="mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-600">{emailError}</p>
                    <Link href="/auth/login"
                      className="text-xs text-blue-600 font-bold hover:underline mt-0.5 inline-flex items-center gap-1">
                      Sign in to your account <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={form.password} onChange={handleChange}
                  placeholder={`At least ${MIN_PASSWORD} characters`} required
                  className={`${inputCls(!!passwordError)} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {pwLen > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(lvl => (
                      <div key={lvl} className={`h-1 flex-1 rounded-full transition-all ${
                        pwStrength >= lvl ? strengthMeta[pwStrength].color : "bg-gray-100"
                      }`} />
                    ))}
                  </div>
                  <p className={`text-[11px] font-semibold ${
                    pwStrength <= 1 ? "text-red-400" :
                    pwStrength === 2 ? "text-amber-500" :
                    pwStrength === 3 ? "text-blue-500" : "text-green-600"
                  }`}>
                    {strengthMeta[pwStrength].label}
                    {pwLen < MIN_PASSWORD && ` · ${MIN_PASSWORD - pwLen} more character${MIN_PASSWORD - pwLen !== 1 ? "s" : ""} needed`}
                  </p>
                </div>
              )}

              {passwordError && (
                <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-semibold text-red-600">{passwordError}</p>
                </div>
              )}
            </div>

            {/* Student toggle */}
            <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              form.isStudent ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"
            }`}>
              <input type="checkbox" name="isStudent" checked={form.isStudent} onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-600" />
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${form.isStudent ? "bg-blue-100" : "bg-gray-100"}`}>
                <GraduationCap className={`w-4 h-4 ${form.isStudent ? "text-blue-600" : "text-gray-400"}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${form.isStudent ? "text-blue-700" : "text-gray-700"}`}>I am a student</p>
                <p className="text-xs text-gray-400 mt-0.5">Unlock exclusive student discounts</p>
              </div>
            </label>

            {/* Student card upload */}
            {form.isStudent && (
              <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Upload Student Card</p>
                    <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">A clear photo of your student ID. Reviewed within 1–2 business days.</p>
                  </div>
                </div>
                {studentCardPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={studentCardPreview} alt="Student card"
                      className="w-full max-h-40 object-contain rounded-xl border border-blue-100 bg-white" />
                    <button type="button" onClick={removeCard}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Card ready to upload
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-400 hover:text-blue-600 group">
                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">Click to upload student card</span>
                    <span className="text-xs text-blue-300">JPG, PNG, WEBP · max 5 MB</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCardFileChange} className="hidden" />
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  RUPP, NPIC, ITC, Norton, AUPP or any accredited Cambodian university
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{uploadingCard ? "Uploading card…" : "Creating account…"}</>
                : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 mb-3">Already have an account?</p>
            <Link href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}