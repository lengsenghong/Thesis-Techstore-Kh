"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, Facebook, Send, Shield, Truck, Heart } from "lucide-react";

// Only real, working pages
const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "All Products",  href: "/products" },
      { label: "Laptops",       href: "/products?categorySlug=laptops" },
      { label: "Gaming",        href: "/products?categorySlug=gaming" },
      { label: "Components",    href: "/products?categorySlug=components" },
      { label: "Monitors",      href: "/products?categorySlug=monitors" },
      { label: "Deals",         href: "/products?badge=SALE" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Profile",    href: "/profile" },
      { label: "My Orders",     href: "/orders" },
      { label: "Wishlist",      href: "/wishlist" },
      { label: "Sign In",       href: "/auth/login" },
      { label: "Register",      href: "/auth/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us",      href: "/about" },
    ],
  },
];

const features = [
  { icon: Shield, title: "Genuine Products",  desc: "100% authentic tech" },
  { icon: Truck,  title: "Fast Delivery",     desc: "1-2 days nationwide" },
  { icon: Heart,  title: "12-Month Warranty", desc: "On all products" },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">

      {/* ── Features bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/techstore-logo.png"
                  alt="TechStore KH"
                  fill
                  className="object-contain brightness-0 invert" /* white version on dark bg */
                />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  TechStore<span className="text-blue-400">KH</span>
                </span>
                <p className="text-[10px] text-gray-400 -mt-0.5">Cambodia's Premier Tech Store</p>
              </div>
            </Link>

            <p className="text-sm leading-relaxed mb-5 text-gray-400">
              Your trusted source for genuine tech products in Cambodia. From gaming rigs to productivity laptops — we've got you covered.
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-gray-400">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Street 271, Toul Kork, Phnom Penh</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>+855 12 345 678</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>support@techstore.kh</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-bold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="border-t border-gray-700/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TechStore KH. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-3">
            <Link href="https://facebook.com/techstorekh" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110">
              <Facebook className="w-4 h-4" fill="currentColor" />
            </Link>
            <Link href="https://t.me/techstorekh" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-500 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110">
              <Send className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}