"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, ShoppingCart, User, Menu, X, Package,
  LayoutDashboard, LogOut, ChevronDown, Zap, Heart, Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const navLinks = [
  { href: "/",                               label: "Home"     },
  { href: "/products",                       label: "Products" },
  { href: "/products?categorySlug=laptops",  label: "Laptops"  },
  { href: "/products?categorySlug=gaming",   label: "Gaming"   },
  { href: "/products?badge=sale",            label: "Deals", badge: "HOT" },
];

export function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();

  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getTotalItems }    = useCart();
  const { getTotalWishlist } = useWishlist();

  const itemCount     = getTotalItems();
  const wishlistCount = getTotalWishlist();

  const [search,        setSearch]        = useState("");
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className={`sticky top-0 z-[999] transition-all duration-300 ${
      scrolled
        ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-gray-200/50 border-b border-gray-200"
        : "bg-white/90 backdrop-blur-sm border-b border-gray-100"
    }`}>
      <div className="container-wide">
        <div className="flex items-center h-16 gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                TechStore<span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">KH</span>
              </span>
              <p className="text-[10px] text-gray-500 -mt-0.5">Cambodia's Tech Store</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const base   = link.href.split("?")[0];
              const active = pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(base) && base !== "/");
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/30"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}>
                  {link.label}
                  {link.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className={`relative w-full transition-all duration-300 ${searchFocused ? "scale-[1.02]" : ""}`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for products..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* ── Wishlist ── */}
            <Link href="/wishlist" aria-label="Wishlist"
              className="relative p-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group">
              <Heart
                className={`w-5 h-5 transition-all duration-200 group-hover:scale-110 ${
                  wishlistCount > 0 ? "fill-red-500 text-red-500" : ""
                }`}
                strokeWidth={wishlistCount > 0 ? 0 : 2}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* ── Cart ── */}
            <Link href="/cart" aria-label="Cart"
              className="relative p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* ── User ── */}
            {isAuthenticated ? (
              <div className="relative ml-0.5" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block max-w-[80px] truncate text-sm text-gray-900 font-semibold">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-200 shadow-xl transition-all duration-200 origin-top-right z-50 overflow-hidden ${
                  dropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-base font-bold border-2 border-white/30 flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-blue-100 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all group">
                      <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      My Profile
                    </Link>
                    <Link href="/orders" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all group">
                      <Package className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      My Orders
                    </Link>
                    <Link href="/wishlist" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all group">
                      <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "fill-red-400 text-red-400" : "text-gray-400 group-hover:text-red-500"}`} strokeWidth={wishlistCount > 0 ? 0 : 2} />
                      <span className="flex-1">Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">{wishlistCount}</span>
                      )}
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all">
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="flex-1">Admin Panel</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-2" />
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/40 transition-all hover:scale-105">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="pb-4 pt-2 border-t border-gray-100 space-y-1.5">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                {link.label}
                {link.badge && (
                  <span className="ml-2 px-2 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">{link.badge}</span>
                )}
              </Link>
            ))}

            {/* Wishlist in mobile nav */}
            <Link href="/wishlist"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "fill-red-500 text-red-500" : ""}`} strokeWidth={wishlistCount > 0 ? 0 : 2} />
              Wishlist
              {wishlistCount > 0 && (
                <span className="ml-auto text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{wishlistCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}