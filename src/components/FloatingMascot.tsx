"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const SIZE = 110;

const MascotViewer = dynamic(() => import("@/components/MascotViewer"), {
  ssr: false,
  loading: () => <span style={{ fontSize: 52, lineHeight: 1 }}>🤖</span>,
});

const MASCOT_GLB = "/mascot2.glb";

const GREETINGS = [
  "Hi! I'm TechBot 👋",
  "Need help? 😊",
  "Ask me anything! 💬",
  "Deals today! 🔥",
  "Khmer & English 🇰🇭",
];

const SECTION_TIPS: Record<string, string> = {
  laptops:      "Laptop deals here! 💻",
  gaming:       "Gaming gear! 🎮",
  sale:         "Up to 40% off! 🏷️",
  new:          "Just dropped! ✨",
  brands:       "Top brands! 🏆",
  testimonials: "Love us! ⭐",
};

export default function FloatingMascot() {
  // posX: left px. posY: offset from vertical center (0 = centered)
  const [posX, setPosX]   = useState(-(SIZE + 100));
  const [posY, setPosY]   = useState(0);
  const [phase, setPhase] = useState<"hidden" | "flying" | "landed">("hidden");

  const [tiltZ, setTiltZ]   = useState(0);
  const [floatY, setFloatY] = useState(0);

  // Drag refs — no state for perf
  const isDragging      = useRef(false);
  const didDrag         = useRef(false);
  const dragStartPos    = useRef({ x: 0, y: 0 });
  const dragStartMouse  = useRef({ x: 0, y: 0 });
  // Track actual pixel position during drag (not CSS top:50%)
  const absY            = useRef(0); // absolute top px from viewport top

  // Bubble
  const [bubble, setBubble]     = useState(GREETINGS[0]);
  const [bubbleOn, setBubbleOn] = useState(false);
  const [greetIdx, setGreetIdx] = useState(0);

  const lastScrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers      = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  // ── Fly in ───────────────────────────────────────────────────────────
  useEffect(() => {
    later(() => { setPhase("flying"); setTiltZ(14); setPosX(16); }, 700);
    later(() => { setTiltZ(0); setFloatY(-12); }, 1650);
    later(() => { setFloatY(0); setPhase("landed"); }, 1900);
    later(() => setBubbleOn(true), 2400);
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line

  // ── Greeting rotation ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "landed") return;
    const t = setInterval(() => {
      setBubbleOn(false);
      setTimeout(() => {
        setGreetIdx(i => {
          const next = (i + 1) % GREETINGS.length;
          setBubble(GREETINGS[next]);
          return next;
        });
        setBubbleOn(true);
      }, 250);
    }, 4000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Scroll tilt ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      if (phase !== "landed" || isDragging.current) return;
      const cur = window.scrollY;
      const d = cur - lastScrollY.current;
      lastScrollY.current = cur;
      if (Math.abs(d) < 2) return;
      const down = d > 0;
      const str = Math.min(Math.abs(d) / 8, 1);
      setTiltZ(down ? -12 * str : 10 * str);
      setFloatY(down ? -14 * str : 10 * str);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        setTiltZ(0); setFloatY(0);
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  // ── Section tips ──────────────────────────────────────────────────────
  const doTip = useCallback((tip: string) => {
    if (phase !== "landed") return;
    setBubbleOn(false);
    setTimeout(() => { setBubble(tip); setBubbleOn(true); }, 200);
    setFloatY(-16); setTiltZ(-8);
    setTimeout(() => { setFloatY(0); setTiltZ(0); }, 420);
  }, [phase]);

  useEffect(() => {
    if (typeof window === "undefined" || phase !== "landed") return;
    const targets = document.querySelectorAll("[data-mascot]");
    if (!targets.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const tip = SECTION_TIPS[(e.target as HTMLElement).dataset.mascot || ""];
        if (tip) doTip(tip);
      });
    }, { threshold: 0.4 });
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, [phase, doTip]);

  // ── Drag ──────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "landed") return;
    isDragging.current = true;
    didDrag.current    = false;
    dragStartMouse.current = { x: e.clientX, y: e.clientY };

    // Capture current absolute position
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    absY.current = rect.top;
    dragStartPos.current = { x: posX, y: rect.top };

    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [phase, posX]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartMouse.current.x;
    const dy = e.clientY - dragStartMouse.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setPosX(dragStartPos.current.x + dx);
    // posY stores offset from vertical center
    const newAbsY = dragStartPos.current.y + dy;
    const center  = window.innerHeight / 2 - SIZE / 2;
    setPosY(newAbsY - center);
    absY.current = newAbsY;
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    if (!didDrag.current) {
      window.dispatchEvent(new CustomEvent("techbot:open"));
    }
  }, []);

  const isLanded = phase === "landed";
  const isDrag   = isDragging.current;

  // Position strategy:
  // - Before drag: use top:50% + translateY(-50%) so it's centered
  // - After drag:  use top:auto with the absolute posY offset
  const usingCenter = posY === 0 && !isDrag;

  return (
    <>
      <style>{`
        @keyframes mascotFloat {
          0%,100% { transform: translateY(0px) rotateZ(0deg); }
          50%      { transform: translateY(-8px) rotateZ(1deg); }
        }
        @keyframes bubbleFade {
          from { opacity:0; transform:translateY(4px) scale(0.9); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes trailFade { from { opacity:0.5; } to { opacity:0; } }
        .mascot-float { animation: mascotFloat 3s ease-in-out infinite; }
      `}</style>

      {/* Flight trail */}
      {phase === "flying" && (
        <div style={{
          position:"fixed", left:0, top:"50%",
          height:2, width:Math.max(0, posX + SIZE / 2),
          background:"linear-gradient(to right,transparent,hsl(var(--primary)/0.4))",
          borderRadius:99, zIndex:44, pointerEvents:"none",
          animation:"trailFade 1s ease-out forwards",
        }}/>
      )}

      {/* Container */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: "fixed",
          left: posX,
          // Positioning: centered by default, absolute after drag
          ...(usingCenter
            ? { top: "50%", transform: `translateY(calc(-50% + ${floatY}px)) rotateZ(${tiltZ}deg)` }
            : { top: `calc(50% + ${posY}px)`, transform: `translateY(-50%) translateY(${floatY}px) rotateZ(${tiltZ}deg)` }
          ),
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          pointerEvents: isLanded ? "auto" : "none",
          cursor: isDrag ? "grabbing" : isLanded ? "grab" : "default",
          userSelect: "none",
          transition: phase === "hidden"
            ? "none"
            : phase === "flying"
            ? "left 1.15s cubic-bezier(0.22,1.35,0.36,1)"
            : isDrag
            ? "none"
            : "left 0.4s ease, transform 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* Speech bubble */}
        {bubbleOn && isLanded && (
          <div key={bubble} style={{
            marginBottom:6, marginLeft:10,
            animation:"bubbleFade 0.22s ease-out both",
            position:"relative", pointerEvents:"none",
          }}>
            <div style={{
              background:"hsl(var(--card))",
              border:"1px solid hsl(var(--border))",
              borderRadius:"12px 12px 12px 4px",
              padding:"7px 12px", fontSize:11, fontWeight:600,
              color:"hsl(var(--foreground))",
              boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
              whiteSpace:"nowrap",
            }}>
              {bubble}
            </div>
            <div style={{
              position:"absolute", bottom:-5, left:10,
              width:8, height:8,
              background:"hsl(var(--card))",
              borderLeft:"1px solid hsl(var(--border))",
              borderBottom:"1px solid hsl(var(--border))",
              clipPath:"polygon(0 0,100% 0,0 100%)",
            }}/>
          </div>
        )}

        {/* Robot — no bg, no border, pure model */}
        <div className={isLanded && !isDrag ? "mascot-float" : ""}>
          <MascotViewer glbPath={MASCOT_GLB} size={SIZE} />
        </div>
      </div>
    </>
  );
}