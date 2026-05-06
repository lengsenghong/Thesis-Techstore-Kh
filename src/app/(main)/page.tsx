"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight, ArrowUpRight,
  Laptop, Monitor, Cpu, Gamepad2, Tag,
  ShoppingCart, Zap, Clock, Headphones, Keyboard,
  Shield, Truck, RefreshCw, HeadphonesIcon,
} from "lucide-react";
import { productsApi, bannersApi } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import type { Product, Banner } from "@/types";
import toast from "react-hot-toast";
import ProductCard from "@/components/product/ProductCard";

const BRANDS = ["ROCCAT","MSI","RAZER","Thermaltake","ADATA","HP","GIGABYTE","ASUS","Corsair","Intel","AMD","NVIDIA"];

const CATEGORIES = [
  { label:"Laptops",     href:"/products?categorySlug=laptops",    icon:Laptop,     color:"from-violet-500/20 to-purple-600/20 hover:from-violet-500/30 hover:to-purple-600/30", accent:"text-violet-400" },
  { label:"Monitors",    href:"/products?categorySlug=monitors",   icon:Monitor,    color:"from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30",         accent:"text-cyan-400" },
  { label:"Components",  href:"/products?categorySlug=components", icon:Cpu,        color:"from-orange-500/20 to-red-600/20 hover:from-orange-500/30 hover:to-red-600/30",       accent:"text-orange-400" },
  { label:"Gaming",      href:"/products?badge=HOT",               icon:Gamepad2,   color:"from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30", accent:"text-emerald-400" },
  { label:"Peripherals", href:"/products?categorySlug=peripherals",icon:Keyboard,   color:"from-pink-500/20 to-rose-600/20 hover:from-pink-500/30 hover:to-rose-600/30",         accent:"text-pink-400" },
  { label:"Deals",       href:"/products?badge=SALE",              icon:Tag,        color:"from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/30 hover:to-amber-600/30",   accent:"text-yellow-400" },
  { label:"New",         href:"/products?badge=NEW",               icon:Zap,        color:"from-teal-500/20 to-sky-600/20 hover:from-teal-500/30 hover:to-sky-600/30",           accent:"text-teal-400" },
  { label:"Audio",       href:"/products?categorySlug=audio",      icon:Headphones, color:"from-indigo-500/20 to-violet-600/20 hover:from-indigo-500/30 hover:to-violet-600/30", accent:"text-indigo-400" },
];

const TESTIMONIALS = [
  { id:1, name:"Tanya Brown",  initials:"TB", from:"Verified Buyer · Phnom Penh", color:"from-violet-500 to-purple-600", rating:5, content:"My first order arrived today in perfect condition. TechStore KH stayed in touch the entire way. Such great service." },
  { id:2, name:"Sopheak Meng", initials:"SM", from:"Verified Buyer · Siem Reap",  color:"from-blue-500 to-cyan-600",     rating:5, content:"Helped me find the perfect laptop for my programming course. The AI chatbot recommended exactly what I needed. Bakong payment was super easy!" },
  { id:3, name:"Dara Pich",    initials:"DP", from:"Verified Buyer · Battambang", color:"from-emerald-500 to-teal-600",  rating:5, content:"Amazing selection of design workstations. Got my ASUS ROG delivered in 2 days. The specs were accurate. Will shop here again!" },
];

const STATIC_SLIDES: Banner[] = [
  { id:-1, title:"SCORE A BONUS GAMING MONITOR", subtitle:"Limited Time Offer",     imageUrl:"", linkUrl:"/products?badge=FEATURED",        linkLabel:"Shop Now", sortOrder:0, isActive:true, createdAt:"", updatedAt:"" },
  { id:-2, title:"MSI TITAN GT77 HX",             subtitle:"Flagship Gaming Laptop", imageUrl:"", linkUrl:"/products?categorySlug=laptops", linkLabel:"Explore",  sortOrder:1, isActive:true, createdAt:"", updatedAt:"" },
];

const TRUST_BADGES = [
  { icon:Truck,          title:"Free Delivery",   desc:"On orders over $50" },
  { icon:Shield,         title:"2-Year Warranty", desc:"On all products" },
  { icon:RefreshCw,      title:"Easy Returns",    desc:"30-day hassle-free returns" },
  { icon:HeadphonesIcon, title:"24/7 Support",    desc:"Expert tech assistance" },
];

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(h = 24) {
  const end = useRef(Date.now() + h * 3_600_000);
  const [r, setR] = useState(end.current - Date.now());
  useEffect(() => {
    const t = setInterval(() => setR(end.current - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return {
    h: Math.floor(r / 3_600_000),
    m: Math.floor((r % 3_600_000) / 60_000),
    s: Math.floor((r % 60_000) / 1000),
  };
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <span className="text-2xl font-black text-white tabular-nums tracking-tighter z-10">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}

function FlashCountdown() {
  const { h, m, s } = useCountdown(6);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 font-mono font-black text-sm">
      <span className="text-white bg-white/20 rounded px-1.5 py-0.5">{pad(h)}</span>
      <span className="text-white/60">:</span>
      <span className="text-white bg-white/20 rounded px-1.5 py-0.5">{pad(m)}</span>
      <span className="text-white/60">:</span>
      <span className="text-white bg-white/20 rounded px-1.5 py-0.5">{pad(s)}</span>
    </div>
  );
}

// ── Product scroll section ────────────────────────────────────────────────────
function ProductScrollSection({
  title, eyebrow, products, isLoading, viewAllHref, flashSale = false, darkBg = false, mascotKey,
}: {
  title: string; eyebrow?: string; products: Product[]; isLoading: boolean;
  viewAllHref: string; flashSale?: boolean; darkBg?: boolean; mascotKey?: string;
}) {
  const { addToCart } = useCart();
  const countdown = useCountdown(8);

  return (
    <section data-mascot={mascotKey} className={`py-12 ${darkBg ? "bg-zinc-950/60" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-7 gap-4">
          <div className="flex flex-col gap-1">
            {eyebrow && <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</span>}
            <div className="flex items-center gap-3">
              {flashSale && <Zap className="w-5 h-5 text-orange-400 fill-orange-400" />}
              <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
              {flashSale && (
                <div className="flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-mono font-bold text-orange-400">
                    {String(countdown.h).padStart(2,"0")}:{String(countdown.m).padStart(2,"0")}:{String(countdown.s).padStart(2,"0")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link href={viewAllHref} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group shrink-0">
            View All <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-hidden pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0 rounded-2xl bg-white/5 animate-pulse h-80" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">No products available.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {products.map(p => (
              <div key={p.id} className="w-52 flex-shrink-0 snap-start group relative">
                <ProductCard product={p} />
                <button
                  onClick={e => {
                    e.preventDefault();
                    addToCart(p, 1);   // ✅ correct signature: (product, quantity)
                    toast.success(`${p.name.slice(0, 28)}… added`);
                  }}
                  className="absolute bottom-[52px] left-2 right-2 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xl shadow-primary/20"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Tabbed scroll section ─────────────────────────────────────────────────────
function TabbedScrollSection({
  title, eyebrow, tabs, allProducts, isLoading, mascotKey,
}: {
  title: string; eyebrow?: string; tabs: string[]; allProducts: Product[];
  isLoading: boolean; mascotKey?: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const { addToCart } = useCart();

  return (
    <section data-mascot={mascotKey} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div className="flex flex-col gap-1">
            {eyebrow && <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</span>}
            <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  activeTab === i
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-hidden pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0 rounded-2xl bg-white/5 animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {allProducts.map(p => (
              <div key={p.id} className="w-52 flex-shrink-0 snap-start group relative">
                <ProductCard product={p} />
                <button
                  onClick={e => {
                    e.preventDefault();
                    addToCart(p, 1);   // ✅ correct signature
                    toast.success("Added to cart");
                  }}
                  className="absolute bottom-[52px] left-2 right-2 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xl shadow-primary/20"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [heroSlide, setHeroSlide] = useState(0);
  const [testimonialSlide, setTestimonialSlide] = useState(0);

  const { data: liveBanners = [] } = useQuery<Banner[]>({
    queryKey: ["banners", "public"],
    queryFn: () => bannersApi.list(),
    staleTime: 60_000,
  });

  const heroSlides = liveBanners.length > 0 ? liveBanners : STATIC_SLIDES;

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    const t = setInterval(() => setTestimonialSlide(s => (s + 1) % TESTIMONIALS.length), 7000);
    return () => clearInterval(t);
  }, []);

  const prevHero = useCallback(() => setHeroSlide(s => (s - 1 + heroSlides.length) % heroSlides.length), [heroSlides.length]);
  const nextHero = useCallback(() => setHeroSlide(s => (s + 1) % heroSlides.length), [heroSlides.length]);

  const { data: saleData,   isLoading: saleLoading }   = useQuery({ queryKey: ["products","sale"],    queryFn: () => productsApi.list({ badge: "SALE",  limit: 12 }) });
  const { data: newData,    isLoading: newLoading }    = useQuery({ queryKey: ["products","new"],     queryFn: () => productsApi.list({ badge: "NEW",   limit: 12 }) });
  const { data: laptopData, isLoading: laptopLoading } = useQuery({ queryKey: ["products","laptops"], queryFn: () => productsApi.list({ categorySlug: "laptops", limit: 12 }) });

  const countdown = useCountdown(20);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#080810] min-h-[360px] lg:min-h-[420px] flex items-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        {heroSlides.map((s, i) => (
          <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === heroSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {s.imageUrl && (
              <img src={s.imageUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-30"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080810]/90 via-[#080810]/40 to-transparent" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
              <div className="max-w-lg">
                {s.subtitle && (
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] font-black tracking-[0.25em] uppercase text-primary">{s.subtitle}</span>
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl font-black text-white uppercase leading-[0.95] mb-2 tracking-[-0.02em]">{s.title}</h1>
                <p className="text-xs text-white/50 mb-6 leading-relaxed max-w-sm">Intel Core i9-13980HX · RTX 4090 · 240Hz QHD Display. Engineered for dominance.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {s.linkUrl && (
                    <Link href={s.linkUrl} className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-2xl shadow-primary/30 uppercase tracking-wide">
                      {s.linkLabel ?? "Shop Now"}<ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link href="/products" className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white/80 rounded-full border border-white/15 hover:border-white/30 hover:text-white transition-all uppercase tracking-wide">
                    Browse All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Countdown */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-4 z-10">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Deal Ends In</p>
          <div className="flex gap-2">
            <CountdownDigit value={countdown.h} label="hrs" />
            <div className="text-white/30 text-xl font-black self-center pb-4">:</div>
            <CountdownDigit value={countdown.m} label="min" />
            <div className="text-white/30 text-xl font-black self-center pb-4">:</div>
            <CountdownDigit value={countdown.s} label="sec" />
          </div>
        </div>

        <button onClick={prevHero} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/8 hover:bg-white/18 text-white flex items-center justify-center transition-all z-10 border border-white/12 backdrop-blur-sm">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={nextHero} className="absolute right-4 lg:right-64 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/8 hover:bg-white/18 text-white flex items-center justify-center transition-all z-10 border border-white/12 backdrop-blur-sm">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-6 left-1/2 lg:left-8 -translate-x-1/2 lg:translate-x-0 flex gap-2 z-10">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === heroSlide ? "bg-white w-8" : "bg-white/25 w-2"}`} />
          ))}
        </div>
      </section>

      {/* ── Trust Badges ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/40">
            {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-6 py-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Grid ─────────────────────────────────────────────────── */}
      <section data-mascot="gaming" className="py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-1">Explore</p>
              <h2 className="text-2xl font-black tracking-tight">Shop by Category</h2>
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map(({ label, href, icon: Icon, color, accent }) => (
              <Link key={label} href={href} className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-br border border-white/5 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg group ${color}`}>
                <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-foreground/80 group-hover:text-foreground text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flash Sale ────────────────────────────────────────────────────── */}
      {(saleData?.items?.length ?? 0) > 0 && (
        <section data-mascot="sale" className="py-10 relative overflow-hidden bg-[#0e0810]">
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                  <Zap className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-xs font-black text-white uppercase tracking-wide">Flash Sale</span>
                </div>
                <FlashCountdown />
              </div>
              <Link href="/products?badge=SALE" className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors group">
                View All <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
              {saleLoading
                ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-52 flex-shrink-0 rounded-2xl bg-white/5 animate-pulse h-80" />)
                : saleData?.items.map(p => (
                    <div key={p.id} className="w-52 flex-shrink-0 snap-start">
                      <ProductCard product={p} />
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-border/30" />
      <ProductScrollSection title="New Arrivals" eyebrow="Just In" products={newData?.items ?? []} isLoading={newLoading} viewAllHref="/products?badge=NEW" mascotKey="new" />
      <div className="border-t border-border/30" />
      <TabbedScrollSection title="Laptops" eyebrow="Portable Power" tabs={["All","Gaming","Business","Student"]} allProducts={laptopData?.items ?? []} isLoading={laptopLoading} mascotKey="laptops" />

      {/* ── Brand Marquee ─────────────────────────────────────────────────── */}
      <section data-mascot="brands" className="py-10 border-y border-border/30 overflow-hidden">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 mb-6">Authorised Partners</p>
        <div className="relative">
          <div className="flex animate-marquee gap-16 whitespace-nowrap">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span key={i} className="text-base font-black text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors cursor-default tracking-tight shrink-0 select-none">{brand}</span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Promo Banners ─────────────────────────────────────────────────── */}
      <section data-mascot="gaming" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/products?badge=HOT" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/20 border border-violet-500/20 p-8 min-h-[200px] flex flex-col justify-end hover:border-violet-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl" />
              <Gamepad2 className="absolute right-6 top-6 w-20 h-20 text-violet-500/20 group-hover:text-violet-500/30 transition-colors" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400/80 mb-2">New Season</p>
              <h3 className="text-2xl font-black text-foreground mb-3">Gaming Collection</h3>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-400 group-hover:gap-2.5 transition-all">Explore <ArrowRight className="w-4 h-4" /></span>
            </Link>
            <Link href="/products?badge=SALE" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-red-600/20 border border-amber-500/20 p-8 min-h-[200px] flex flex-col justify-end hover:border-amber-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
              <Tag className="absolute right-6 top-6 w-20 h-20 text-amber-500/20 group-hover:text-amber-500/30 transition-colors" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/80 mb-2">Up to 40% Off</p>
              <h3 className="text-2xl font-black text-foreground mb-3">Clearance Sale</h3>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400 group-hover:gap-2.5 transition-all">Shop Deals <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section data-mascot="testimonials" className="py-16 border-t border-border/30 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-2">Social Proof</p>
            <h2 className="text-2xl font-black tracking-tight">What Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.id}
                onClick={() => setTestimonialSlide(i)}
                className={`relative p-7 rounded-3xl border transition-all cursor-pointer ${
                  i === testimonialSlide
                    ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/30 bg-secondary/30 hover:border-border"
                }`}
              >
                <div className="absolute top-5 right-6 text-5xl font-black text-border/30 leading-none select-none">"</div>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 relative z-10">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>{t.initials}</div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.from}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">Stay Updated</h2>
            <p className="text-sm text-muted-foreground">Get exclusive deals and new product launches delivered to your inbox.</p>
          </div>
          <form className="flex gap-2 max-w-md mx-auto" onSubmit={e => { e.preventDefault(); toast.success("Subscribed!"); }}>
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}