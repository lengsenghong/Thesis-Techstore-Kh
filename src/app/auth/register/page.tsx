"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Loader2, GraduationCap,
  Upload, X, CheckCircle, Zap, ImageIcon,
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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", isStudent: false,
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [studentCardFile,     setStudentCardFile]     = useState<File | null>(null);
  const [studentCardPreview,  setStudentCardPreview]  = useState<string | null>(null);
  const [uploadingCard,       setUploadingCard]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "isStudent" && !checked) {
      setStudentCardFile(null);
      setStudentCardPreview(null);
    }
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
    setStudentCardFile(null);
    setStudentCardPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.isStudent && !studentCardFile) { toast.error("Please upload your student card"); return; }

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
          toast.success("Account created! Student card under review.");
        } catch {
          toast.success("Account created!");
          toast.error("Student card upload failed — re-upload in your profile.");
        } finally {
          setUploadingCard(false);
        }
      } else {
        toast.success("Welcome to TechStore KH!");
      }
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || uploadingCard;

  const inputCls = "w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all";

  return (
    <div className="min-h-screen flex bg-gray-950">

      {/* ── Left panel — dark branding ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/40 to-gray-950" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
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

        {/* Main copy */}
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

          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-sm text-gray-400 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-xs text-gray-600 font-medium">© 2024 TechStore KH. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 lg:px-14 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl text-gray-900">
              TechStore<span className="text-blue-600">KH</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create account</h2>
            <p className="text-gray-400 text-sm">Start shopping the best tech in Cambodia</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Phone side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Sopheak Meng"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+855 12 345 678"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-all ${
                      form.password.length >= level * 3
                        ? level <= 1 ? "bg-red-400"
                        : level <= 2 ? "bg-amber-400"
                        : level <= 3 ? "bg-blue-400"
                        : "bg-green-400"
                        : "bg-gray-100"
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Student toggle */}
            <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              form.isStudent
                ? "border-blue-200 bg-blue-50"
                : "border-gray-100 bg-gray-50 hover:border-gray-200"
            }`}>
              <input
                type="checkbox"
                name="isStudent"
                checked={form.isStudent}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-600"
              />
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
                    <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
                      A clear photo of your student ID. Reviewed within 1–2 business days.
                    </p>
                  </div>
                </div>

                {studentCardPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={studentCardPreview}
                      alt="Student card"
                      className="w-full max-h-40 object-contain rounded-xl border border-blue-100 bg-white"
                    />
                    <button
                      type="button"
                      onClick={removeCard}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Card ready to upload
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-400 hover:text-blue-600 group"
                  >
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{uploadingCard ? "Uploading card…" : "Creating account…"}</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 mb-3">Already have an account?</p>
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}