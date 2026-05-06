import Link from "next/link";
import {
  Zap, Shield, Truck, Heart, Users, Award, MapPin,
  ArrowRight, Star, Cpu, Monitor, Headphones, Smartphone,
} from "lucide-react";

const STATS = [
  { value: "5,000+", label: "Happy Customers", icon: Users },
  { value: "2,000+", label: "Products Listed", icon: Cpu },
  { value: "4.9★",   label: "Average Rating",  icon: Star },
  { value: "3 Years", label: "In Business",    icon: Award },
];

const VALUES = [
  {
    icon: Shield,
    title: "100% Genuine",
    desc: "Every product we sell is sourced directly from authorized distributors. No grey market, no fakes — ever.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Phnom Penh same-day delivery. Nationwide shipping in 1–3 business days via trusted local couriers.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: Heart,
    title: "After-Sales Care",
    desc: "We don't disappear after checkout. 12-month warranty support and a dedicated helpline for every purchase.",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Zap,
    title: "Expert Advice",
    desc: "Our team are genuine tech enthusiasts. Ask us anything — we'll help you find exactly what you need.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const CATEGORIES = [
  { icon: Monitor,     label: "Monitors & Displays" },
  { icon: Cpu,         label: "Laptops & PCs" },
  { icon: Headphones,  label: "Audio & Headsets" },
  { icon: Smartphone,  label: "Mobile & Tablets" },
];

const TEAM = [
  { name: "Ey Rey",    role: "Mentor",         initials: "SK", color: "from-blue-400 to-blue-600" },
  { name: "Meng Pitola Pich",  role: "Developer",    initials: "RP", color: "from-purple-400 to-purple-600" },
  { name: "Leng Senghong",    role: "Developer",   initials: "CL", color: "from-rose-400 to-pink-500" },
  { name: "An Ponleu",     role: "Developer",       initials: "DM", color: "from-amber-400 to-orange-500" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-blue-300 mb-6">
              <MapPin className="w-3 h-3" />
              Phnom Penh, Cambodia
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
              Cambodia's{" "}
              <span className="text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text">
                Premier
              </span>
              <br />Tech Store.
            </h1>

            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-10">
              Founded in Phnom Penh, TechStore KH was built on a simple belief —
              every Cambodian deserves access to genuine, world-class technology
              at fair prices, backed by honest service.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center py-10 px-6 text-center">
                <Icon className="w-6 h-6 text-blue-600 mb-3" />
                <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Text */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Our Story</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
              Built by tech lovers,<br />for everyone.
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                TechStore KH started in 2022 when our founder, frustrated by
                overpriced grey-market imports and zero post-sale support, decided
                to build the store he wished existed. Starting with a small inventory
                of laptops and peripherals, we grew through word of mouth alone.
              </p>
              <p>
                Today we carry over 2,000 products — from entry-level accessories
                to high-end gaming rigs — and ship to every province in Cambodia.
                Our showroom in Phnom Penh lets customers try before they buy,
                and our team of certified technicians provides warranty repairs on-site.
              </p>
              <p>
                We're proudly Cambodian and fiercely committed to raising the bar
                for tech retail across the Kingdom.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            {/* Main card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {CATEGORIES.map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:bg-white/20 transition-all">
                    <Icon className="w-7 h-7 text-blue-300" />
                    <p className="text-xs text-white font-semibold leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              <div className="relative z-10 mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-2xl">2,000+</p>
                  <p className="text-gray-400 text-xs mt-0.5">Products in stock</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-900">100% Genuine</p>
                <p className="text-[10px] text-gray-400">Authorized distributor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Why Choose Us</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">What we stand for</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div key={title} className={`rounded-2xl border-2 ${border} ${bg} p-6 group hover:-translate-y-1 transition-all duration-200`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">The People</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Meet our team</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            A small, passionate crew of tech enthusiasts dedicated to bringing the best hardware experience to Cambodia.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {TEAM.map(({ name, role, initials, color }) => (
            <div key={name} className="text-center group">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-200`}>
                <span className="text-2xl font-black text-white">{initials}</span>
              </div>
              <p className="font-black text-gray-900 text-sm">{name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Location ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Find Us</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Visit our showroom</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Come in, try products hands-on, and talk to our team. No pressure — just honest advice from people who love tech.
              </p>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Address",  value: "Street 271, Toul Kork, Phnom Penh, Cambodia" },
                  { label: "Hours",    value: "Mon – Sat: 9:00am – 7:00pm" },
                  { label: "Phone",    value: "+855 12 345 678" },
                  { label: "Email",    value: "support@techstore.kh" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="w-16 text-gray-400 font-semibold flex-shrink-0">{label}</span>
                    <span className="text-gray-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Map placeholder */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-gray-200 aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <p className="font-black text-gray-900">TechStore KH</p>
                <p className="text-sm text-gray-500">Street 271, Toul Kork</p>
                <p className="text-sm text-gray-500">Phnom Penh, Cambodia</p>
              </div>
              <a
                href="https://maps.google.com/?q=Phnom+Penh+Cambodia"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Open in Google Maps <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white py-20">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Ready to upgrade<br />
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">your setup?</span>
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Browse our full collection of laptops, PCs, peripherals, and more — all genuine, all warranted.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all hover:scale-105"
            >
              Shop All Products <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all"
            >
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}