"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, ArrowRight, LogIn, Package, X } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Sign in to view your wishlist</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Save your favourite products and come back to them any time. Sign in to keep your wishlist across devices.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:border-blue-200 hover:text-blue-600 transition-all text-sm"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continue browsing →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Your wishlist is empty</h1>
          <p className="text-gray-400 text-sm mb-8">
            Browse our products and heart the ones you love to save them here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:scale-[1.02]"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Wishlist grid ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/25">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Wishlist</h1>
            <p className="text-sm text-gray-400">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add all to cart */}
          <button
            onClick={() => {
              items.forEach((p) => addToCart(p, 1));
              toast.success(`${items.length} items added to cart`);
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Add All to Cart
          </button>

          {/* Clear all */}
          <button
            onClick={() => {
              clearWishlist();
              toast.success("Wishlist cleared");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-100 text-gray-500 text-sm font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((product) => {
          const image      = product.images?.[0] ?? "/placeholder-product.png";
          const isOnSale   = product.originalPrice != null && product.originalPrice > product.price;
          const discount   = isOnSale
            ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
            : 0;
          const outOfStock = (product.stock ?? 1) === 0;

          return (
            <div key={product.id} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

              {/* Remove button */}
              <button
                onClick={() => {
                  removeFromWishlist(product.id);
                  toast.success("Removed from wishlist");
                }}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200 transition-all"
                aria-label="Remove from wishlist"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>

              {/* Image */}
              <Link href={`/products/${product.slug}`} className="relative aspect-square block bg-gray-50 overflow-hidden flex-shrink-0">
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {isOnSale && discount >= 10 && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold shadow-sm">
                    -{discount}%
                  </span>
                )}
                {outOfStock && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-200">
                      Out of Stock
                    </span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1.5">
                {product.brand && (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.brand}</p>
                )}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex-1" />

                {/* Price */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-black text-red-600">${product.price.toFixed(2)}</span>
                  {isOnSale && (
                    <span className="text-[11px] text-gray-400 line-through">${product.originalPrice!.toFixed(2)}</span>
                  )}
                </div>

                <div className="h-px bg-gray-100 my-0.5" />

                {/* Add to cart */}
                <button
                  onClick={() => {
                    if (outOfStock) return;
                    addToCart(product, 1);
                    toast.success(`${product.name.slice(0, 25)}… added`);
                  }}
                  disabled={outOfStock}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    outOfStock
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-md hover:shadow-red-500/20 active:scale-[0.98]"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {outOfStock ? "Sold Out" : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/products" className="text-sm text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1.5">
          ← Continue Shopping
        </Link>
        <button
          onClick={() => {
            items.forEach((p) => addToCart(p, 1));
            toast.success(`${items.length} items added to cart`);
          }}
          className="sm:hidden flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          Add All to Cart
        </button>
      </div>
    </div>
  );
}