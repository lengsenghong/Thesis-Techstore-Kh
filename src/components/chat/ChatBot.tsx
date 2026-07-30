"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";
import {
  X, Loader2, User, Trash2, ChevronDown,
  Plus, Check, Package, ChevronRight,
  Cpu, RotateCcw, ArrowRight, Maximize2, Minimize2,
  Zap, Shield,
} from "lucide-react";

const TECHBOT_ICON = "/chatbot.png";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecommendedProduct {
  id: number; name: string; price: number; originalPrice?: number;
  image?: string; badge?: string; rating?: number; slug?: string;
  stock?: number; brand?: string; categoryName?: string;
  specs?: Record<string, string>; colors?: string[];
}
interface Message {
  id: string; role: "user" | "assistant"; content: string;
  timestamp: Date; products?: RecommendedProduct[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WELCOME_MSG: Message = {
  id: "welcome", role: "assistant",
  content: "សួស្ដី! ខ្ញុំជា **TechBot** 👋\n\nI'm your personal tech advisor. Ask me anything about products, specs, pricing, or shipping.",
  timestamp: new Date(),
};

const QUICK_SUGGESTIONS = [
  { label: "Best laptops under $800",       icon: <Cpu className="w-3.5 h-3.5" /> },
  { label: "Gaming PC recommendations",      icon: <Zap className="w-3.5 h-3.5" /> },
  { label: "តើការដឹកជញ្ជូនថ្លៃប៉ុន្មាន?", icon: <Shield className="w-3.5 h-3.5" /> },
  { label: "Return policy",                  icon: <RotateCcw className="w-3.5 h-3.5" /> },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

const BADGE_STYLES: Record<string, string> = {
  new: "product-badge-new", sale: "product-badge-sale",
  hot: "product-badge-hot", featured: "product-badge-featured",
};

const COLOR_HEX: Record<string, string> = {
  black: "#1C1C1E", white: "#F5F5F7", silver: "#8E8E93", gray: "#6D6D72", grey: "#6D6D72",
  blue: "#0071E3", red: "#FF3B30", green: "#34C759", gold: "#FFD60A", pink: "#FF2D55",
  yellow: "#FFD60A", orange: "#FF9500", purple: "#AF52DE", "space gray": "#3A3A3C",
  midnight: "#1C1C2E", starlight: "#F2EFE7", "rose gold": "#E8A598",
  "sky blue": "#5AC8FA", "deep purple": "#6B21A8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function colorHex(name: string) {
  const k = name.toLowerCase();
  if (COLOR_HEX[k]) return COLOR_HEX[k];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return `hsl(${h % 360},50%,55%)`;
}
function pct(p: number, o: number) { return Math.round(((o - p) / o) * 100); }
function formatTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

// ─── Render markdown-lite content ────────────────────────────────────────────
function renderContent(text: string) {
  // Strip [slug] markers the backend may include
  const cleaned = text.replace(/\[[a-z0-9\-]+\]\s*/g, "").trim();
  const lines   = cleaned.split("\n");

  const renderInline = (str: string) =>
    str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={j} className="px-1.5 py-0.5 rounded-md font-mono text-[11px]"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))" }}>
            {part.slice(1, -1)}
          </code>
        );
      return part;
    });

  return (
    <span>
      {lines.map((line, i) => {
        const t = line.trim();
        // Bullet point
        if (/^(\*|-|•)\s+/.test(t)) {
          const body = t.replace(/^(\*|-|•)\s+/, "");
          return (
            <span key={i} className="flex items-start gap-2 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-[0.45em] flex-shrink-0" />
              <span className="flex-1 font-semibold text-foreground leading-snug">{renderInline(body)}</span>
            </span>
          );
        }
        // Arrow reason line (👉 or →)
        if (t.startsWith("👉") || t.startsWith("→")) {
          const body = t.replace(/^(👉|→)\s*/, "");
          return (
            <span key={i} className="flex items-start gap-1.5 ml-3.5 mb-2 mt-0.5">
              <span className="text-primary flex-shrink-0 text-[11px]">→</span>
              <span className="text-[12px] text-muted-foreground leading-relaxed">{renderInline(body)}</span>
            </span>
          );
        }
        if (t === "") return i > 0 ? <span key={i} className="block h-1" /> : null;
        return <span key={i} className="block leading-relaxed">{renderInline(line)}</span>;
      })}
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: "hsl(var(--primary))" }}>
      <img src={TECHBOT_ICON} alt="TechBot"
        style={{ width: size * 0.82, height: size * 0.82, objectFit: "contain" }} />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "text-yellow-400" : "text-muted"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] ml-0.5 tabular-nums font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function StockPill({ stock }: { stock?: number }) {
  if (stock === undefined) return null;
  if (stock === 0)  return <span className="badge badge-red   text-[10px]">Out of stock</span>;
  if (stock <= 5)   return <span className="badge badge-orange text-[10px]">Only {stock} left</span>;
  return <span className="badge badge-green text-[10px]">In stock</span>;
}

function ColorDots({ colors, max = 5 }: { colors: string[]; max?: number }) {
  if (!colors?.length) return null;
  return (
    <div className="flex items-center gap-1">
      {colors.slice(0, max).map((c, i) => (
        <span key={i} title={c}
          className="w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm ring-1 ring-border flex-shrink-0"
          style={{ backgroundColor: colorHex(c) }} />
      ))}
      {colors.length > max && (
        <span className="text-[9px] text-muted-foreground font-medium">+{colors.length - max}</span>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-2 items-start">
      <BotAvatar size={28} />
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex items-center gap-1.5">
        {[0, 160, 320].map(d => (
          <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground opacity-50"
            style={{ animation: `tdot 1.2s ${d}ms ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function OnlineDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: "hsl(var(--success))" }} />
      <span className="relative inline-flex rounded-full h-2 w-2"
        style={{ background: "hsl(var(--success))" }} />
    </span>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ p, onAddToCart, isAdded, fs, onNavigate }: {
  p: RecommendedProduct;
  onAddToCart: (p: RecommendedProduct) => void;
  isAdded: boolean;
  fs: boolean;
  onNavigate: (href: string) => void;
}) {
  const discount   = p.originalPrice && p.originalPrice > p.price ? pct(p.price, p.originalPrice) : null;
  const href       = p.slug ? `/products/${p.slug}` : `/products/${p.id}`;
  const badgeClass = p.badge ? BADGE_STYLES[p.badge.toLowerCase()] : null;

  return (
    <div
      className={`card-hover flex-shrink-0 ${fs ? "w-56" : "w-44"} overflow-hidden group bg-card border border-border`}
      style={{ scrollSnapAlign: "start", borderRadius: "1rem" }}
    >
      {/* Image — navigates on click */}
      <button
        onClick={() => onNavigate(href)}
        className={`relative w-full ${fs ? "h-44" : "h-32"} overflow-hidden flex items-center justify-center cursor-pointer border-0 p-0`}
        style={{ background: "#f5f5f7" }}
      >
        {p.image
          ? <img src={p.image} alt={p.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          : <Package className="w-8 h-8 text-muted-foreground opacity-30" />}
        {badgeClass && (
          <span className={`${badgeClass} absolute top-2 left-2 text-[8px]`}>{p.badge?.toUpperCase()}</span>
        )}
        {discount && (
          <span className="badge product-badge-sale absolute top-2 right-2 text-[8px]">-{discount}%</span>
        )}
      </button>

      <div className="p-3">
        {p.brand && (
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-0.5">{p.brand}</p>
        )}

        {/* Name — navigates on click */}
        <button onClick={() => onNavigate(href)} className="text-left w-full mb-2">
          <p className={`${fs ? "text-[12px]" : "text-[11px]"} font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors`}>
            {p.name}
          </p>
        </button>

        {p.rating != null && p.rating > 0 && <div className="mb-2"><Stars rating={p.rating} /></div>}
        {p.colors && p.colors.length > 0 && <div className="mb-2"><ColorDots colors={p.colors} /></div>}

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className={`${fs ? "text-base" : "text-sm"} font-black text-red-600`}>
            ${p.price.toFixed(2)}
          </span>
          {p.originalPrice && p.originalPrice > p.price && (
            <span className="text-[10px] text-muted-foreground line-through">${p.originalPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="mb-2.5"><StockPill stock={p.stock} /></div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onAddToCart(p)}
            disabled={p.stock === 0}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
              isAdded
                ? "btn-success"
                : p.stock === 0
                ? "opacity-40 cursor-not-allowed btn-secondary"
                : "btn-primary"
            }`}
          >
            {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {isAdded ? "Added" : "Add to Cart"}
          </button>
          <button
            onClick={() => onNavigate(href)}
            className="btn-ghost w-7 h-7 rounded-xl p-0 border border-border flex items-center justify-center flex-shrink-0"
            title="View product"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, addedIds, onAddToCart, onNavigate, fs }: {
  msg: Message;
  addedIds: Set<number>;
  onAddToCart: (p: RecommendedProduct) => void;
  onNavigate: (href: string) => void;
  fs: boolean;
}) {
  const isBot = msg.role === "assistant";
  return (
    <div className={`flex gap-2.5 msg-in ${isBot ? "flex-row" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isBot
          ? <BotAvatar size={28} />
          : (
            <div style={{
              width: 28, height: 28,
              background: "hsl(var(--secondary))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 ${fs ? "max-w-[65%]" : "max-w-[82%]"} ${isBot ? "items-start" : "items-end"}`}>
        {msg.content && (
          <div
            className={`px-4 py-2.5 ${fs ? "text-sm" : "text-[13px]"} leading-relaxed ${
              isBot
                ? "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                : "text-white rounded-2xl rounded-tr-sm"
            }`}
            style={!isBot ? { background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" } : {}}
          >
            {isBot ? renderContent(msg.content) : msg.content}
          </div>
        )}

        {/* Product cards */}
        {msg.products && msg.products.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {msg.products.length} Recommendation{msg.products.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
            >
              {msg.products.map(p => (
                <ProductCard
                  key={p.id} p={p}
                  onAddToCart={onAddToCart}
                  onNavigate={onNavigate}
                  isAdded={addedIds.has(p.id)}
                  fs={fs}
                />
              ))}
            </div>
          </div>
        )}

        <span className="text-[9px] text-muted-foreground tabular-nums px-0.5">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Navbar height hook ───────────────────────────────────────────────────────
function useNavbarHeight() {
  const [navH, setNavH] = useState(64);
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector("nav") ?? document.querySelector("header");
      if (nav) setNavH(nav.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return navH;
}

// ─── Main ChatBot ─────────────────────────────────────────────────────────────
export default function ChatBot() {
  const navH              = useNavbarHeight();
  const router            = useRouter();
  const { addToCart }     = useCart();

  const [isOpen,       setIsOpen]       = useState(false);
  const [isMinimised,  setIsMinimised]  = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([WELCOME_MSG]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);
  const [hasUnread,    setHasUnread]    = useState(false);
  const [addedIds,     setAddedIds]     = useState<Set<number>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimised) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, isMinimised, isFullscreen]);

  // External open trigger
  useEffect(() => {
    const h = () => { setIsOpen(true); setIsMinimised(false); setHasUnread(false); };
    window.addEventListener("techbot:open", h);
    return () => window.removeEventListener("techbot:open", h);
  }, []);

  // Escape exits fullscreen
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && isFullscreen) setIsFullscreen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isFullscreen]);

  // ── Add to cart ─────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback((product: RecommendedProduct) => {
    const cartProduct = {
      id:            product.id,
      name:          product.name,
      price:         product.price,
      originalPrice: product.originalPrice,
      images:        product.image ? [product.image] : [],
      slug:          product.slug ?? String(product.id),
      stock:         product.stock ?? 99,
      brand:         product.brand,
      badge:         product.badge as any,
      categoryName:  product.categoryName,
      specs:         product.specs ?? {},
      colors:        product.colors ?? [],
    } as any;
    addToCart(cartProduct, 1);
    setAddedIds(prev => new Set(prev).add(product.id));
    toast.success(`${product.name.length > 30 ? product.name.slice(0, 30) + "…" : product.name} added to cart`);
  }, [addToCart]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback((msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: "user", content: text, timestamp: new Date(),
    }]);
    setIsTyping(true);
    setLoading(true);

    // Build history — truncate long assistant messages to keep payload small
    const history = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({
        role: m.role,
        content: m.role === "assistant" && m.content.length > 300
          ? m.content.substring(0, 300) + "..."
          : m.content,
      }));

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const replyText: string  = data.reply ?? "Sorry, I couldn't generate a response.";
        const products: RecommendedProduct[] = Array.isArray(data.products) ? data.products : [];

        setIsTyping(false);
        setMessages(prev => [...prev, {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   replyText,
          timestamp: new Date(),
          products:  products.length > 0 ? products : undefined,
        }]);

        if (isMinimised || !isOpen) setHasUnread(true);

      } catch (err) {
        console.error("[ChatBot]", err);
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   "សូមទោស, មានបញ្ហាក្នុងការភ្ជាប់ទំនាក់ទំនង។\n\nSorry, I'm having trouble connecting. Please try again or email **support@techstore.kh**.",
          timestamp: new Date(),
        }]);
      } finally {
        setLoading(false);
        setIsTyping(false);
      }
    })();
  }, [input, loading, messages, isMinimised, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ ...WELCOME_MSG, timestamp: new Date() }]);
    setInput("");
    setAddedIds(new Set());
  };

  const open = () => { setIsOpen(true); setIsMinimised(false); setHasUnread(false); };
  const userMsgCount = messages.filter(m => m.role === "user").length;

  // ── Window geometry ─────────────────────────────────────────────────────────
  const windowStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        top:      navH,
        left:     0, right: 0, bottom: 0,
        width:    "100%",
        height:   `calc(100vh - ${navH}px)`,
        borderRadius: 0,
        zIndex:   998,
      }
    : {
        position: "fixed",
        bottom:   24,
        right:    24,
        width:    380,
        height:   isMinimised ? 72 : 640,
        borderRadius: "1.5rem",
        zIndex:   50,
      };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes tdot      { 0%,80%,100%{transform:translateY(0);opacity:.35;} 40%{transform:translateY(-5px);opacity:1;} }
        @keyframes msgIn     { from{opacity:0;transform:translateY(6px) scale(.98);} to{opacity:1;transform:none;} }
        @keyframes fabPop    { from{opacity:0;transform:scale(.8) translateY(10px);} to{opacity:1;transform:none;} }
        @keyframes windowSlide { from{opacity:0;transform:translateY(20px) scale(.97);} to{opacity:1;transform:none;} }
        .msg-in      { animation: msgIn .2s ease-out both; }
        .fab-pop     { animation: fabPop .35s cubic-bezier(.34,1.4,.64,1) both; }
        .win-slide   { animation: windowSlide .3s cubic-bezier(.34,1.2,.64,1) both; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
        .chat-input:focus-within { border-color: hsl(var(--primary)/.5); box-shadow: 0 0 0 3px hsl(var(--primary)/.1); }
        .suggestion-btn:hover  { border-color: hsl(var(--primary)/.3); background: hsl(var(--primary)/.04); }
        .suggestion-btn:hover .suggestion-icon { color: hsl(var(--primary)); }
        .chat-btn { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:10px; color:hsl(var(--muted-foreground)); transition:background 0.15s,color 0.15s; flex-shrink:0; cursor:pointer; border:none; background:transparent; }
        .chat-btn:hover { background: hsl(var(--secondary)); color: hsl(var(--foreground)); }
      `}</style>

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 fab-pop">
          <button onClick={open} aria-label="Open TechBot" className="group relative flex items-center gap-3">
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border bg-card shadow-[var(--shadow-sm)] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap text-foreground pointer-events-none">
              Chat with us ✨
            </span>
            <span
              className="relative flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0"
              style={{ background: "hsl(var(--primary))", boxShadow: "0 4px 20px hsl(var(--primary)/0.45), 0 2px 8px rgba(0,0,0,0.15)" }}
            >
              <img src={TECHBOT_ICON} alt="TechBot" style={{ width: 36, height: 36, objectFit: "contain" }} />
              {hasUnread && (
                <span
                  className="absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background text-[8px] font-black text-white flex items-center justify-center z-10"
                  style={{ background: "hsl(var(--destructive))" }}
                >!</span>
              )}
            </span>
          </button>
        </div>
      )}

      {/* ── Chat Window ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="flex flex-col overflow-hidden bg-card border border-border win-slide"
          style={{
            ...windowStyle,
            transition: "top .3s ease, left .3s ease, right .3s ease, bottom .3s ease, width .3s ease, height .35s cubic-bezier(.4,0,.2,1), border-radius .3s ease",
            boxShadow:  isFullscreen ? "none" : "var(--shadow-xl)",
            borderTop:  isFullscreen ? "1px solid hsl(var(--border))" : undefined,
          }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className={`flex-shrink-0 flex items-center bg-card border-b border-border gap-2 min-h-[60px] ${isFullscreen ? "px-6 py-3" : "px-4 py-2.5"}`}>
            {/* Bot info + collapse toggle */}
            <button
              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
              onClick={() => { if (!isFullscreen) setIsMinimised(m => !m); }}
            >
              <div className="relative flex-shrink-0">
                <BotAvatar size={isFullscreen ? 44 : 38} />
                <span className="absolute -bottom-0.5 -right-0.5 z-10"><OnlineDot /></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`${isFullscreen ? "text-base" : "text-[13px]"} font-bold text-foreground leading-none`}>TechBot</p>
                  <span className="badge badge-blue text-[8px] uppercase tracking-widest px-1.5 py-0.5">AI</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">TechStore KH · Always online</p>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {messages.length > 1 && !isMinimised && (
                <button className="chat-btn" onClick={clearChat} title="Clear chat">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {!isMinimised && (
                <button
                  className="chat-btn"
                  onClick={() => setIsFullscreen(f => !f)}
                  title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {!isFullscreen && (
                <button className="chat-btn" onClick={() => setIsMinimised(m => !m)}>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMinimised ? "rotate-180" : ""}`} />
                </button>
              )}
              <button className="chat-btn" onClick={() => { setIsOpen(false); setIsFullscreen(false); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Body (hidden when minimised) ──────────────────────────────── */}
          {!isMinimised && (
            <>
              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto chat-scroll"
                style={{ background: "hsl(var(--secondary)/0.4)" }}
              >
                <div
                  className="space-y-4"
                  style={{
                    padding: isFullscreen
                      ? "24px max(32px, calc((100% - 900px) / 2))"
                      : "16px",
                  }}
                >
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      addedIds={addedIds}
                      onAddToCart={handleAddToCart}
                      onNavigate={href => router.push(href)}
                      fs={isFullscreen}
                    />
                  ))}
                  {isTyping && <TypingDots />}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Quick suggestions — only before first user message */}
              {userMsgCount === 0 && (
                <div className={`bg-card border-t border-border ${isFullscreen ? "px-6 pt-4 pb-3" : "px-4 pt-3 pb-2"}`}>
                  <div style={isFullscreen ? { maxWidth: 900, margin: "0 auto" } : {}}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Try asking</p>
                    <div className={`grid gap-1.5 ${isFullscreen ? "grid-cols-4" : "grid-cols-2"}`}>
                      {QUICK_SUGGESTIONS.map(({ label, icon }) => (
                        <button
                          key={label}
                          onClick={() => sendMessage(label)}
                          className="suggestion-btn flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary text-left text-[11px] text-foreground font-medium transition-all group"
                        >
                          <span className="suggestion-icon text-muted-foreground transition-colors flex-shrink-0">{icon}</span>
                          <span className="truncate leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Input bar */}
              <div className={`flex-shrink-0 bg-card border-t border-border ${isFullscreen ? "px-6 py-4" : "px-3.5 py-3.5"}`}>
                <div style={isFullscreen ? { maxWidth: 900, margin: "0 auto" } : {}}>
                  <div className="chat-input flex items-center gap-2 bg-secondary border border-border rounded-2xl px-4 py-2.5 transition-all duration-200">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything…"
                      disabled={loading}
                      className={`flex-1 bg-transparent ${isFullscreen ? "text-sm" : "text-[13px]"} text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-40 min-w-0`}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      aria-label="Send"
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
                      style={input.trim() && !loading
                        ? { background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)", color: "white" }
                        : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", opacity: 0.4, cursor: "not-allowed" }}
                    >
                      {loading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-muted-foreground mt-2 tracking-widest font-medium uppercase">
                    TechStore KH · Powered by AI
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}