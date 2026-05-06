"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, Eye, Zap, TrendingUp, Sparkles } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  showQuickView?: boolean;
}

export default function ProductCard({ product, showQuickView = true }: Props) {
  const { addToCart }                    = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const router = useRouter();

  const [imgError,    setImgError]    = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayImage =
    !imgError && product.images?.[0]
      ? product.images[0]
      : "/placeholder-product.png";

  const rating          = product.rating ?? product.averageRating ?? 0;
  const reviewCount     = product.reviewCount ?? 0;
  const isOnSale        = product.originalPrice != null && product.originalPrice > product.price;
  const isOutOfStock    = (product.stock ?? 1) === 0;
  const wishlisted      = isWishlisted(product.id);
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    toast.success(`${product.name.slice(0, 28)}… added to cart`, { duration: 2000 });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist", { icon: "❤️" });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.slug}`);
  };

  const getBadge = () => {
    if (isOutOfStock)
      return { text: "Sold Out", cls: "bg-gray-400 text-white",   icon: null };
    if (product.badge === "NEW" || product.badge === "new")
      return { text: "New",      cls: "bg-blue-500 text-white",   icon: Sparkles };
    if (product.badge === "HOT" || product.badge === "hot")
      return { text: "Hot",      cls: "bg-orange-500 text-white", icon: Zap };
    if (product.badge === "FEATURED" || product.badge === "featured")
      return { text: "Featured", cls: "bg-purple-500 text-white", icon: TrendingUp };
    if (isOnSale && discountPercent >= 10)
      return { text: `-${discountPercent}%`, cls: "bg-red-500 text-white", icon: null };
    return null;
  };

  const badge = getBadge();

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="relative h-full rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

        {/* ── Image ─────────────────────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">

          {/* Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-150 animate-pulse" />
          )}

          <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain p-3 group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImgError(true)}
          />

          {/* Subtle hover tint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300 pointer-events-none" />

          {/* Badge — top left */}
          {badge && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <div className={`${badge.cls} flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm`}>
                {badge.icon && <badge.icon className="w-2.5 h-2.5" strokeWidth={2.5} />}
                {badge.text}
              </div>
            </div>
          )}

          {/* Low stock pill — bottom left */}
          {!isOutOfStock && product.stock != null && product.stock <= 5 && (
            <div className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-bold shadow-sm">
              Only {product.stock} left!
            </div>
          )}

          {/* Action buttons — top right, slide in on hover */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-10">
            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm transition-all ${
                wishlisted
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200 hover:border-red-200 hover:bg-red-50"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
                strokeWidth={wishlisted ? 0 : 2}
              />
            </button>

            {/* Quick view */}
            {showQuickView && (
              <button
                onClick={handleQuickView}
                className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"
                aria-label="View product"
              >
                <Eye className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* ── Info ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-1.5">

          {/* Brand */}
          {product.brand && (
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h3 className="text-[13px] font-semibold leading-snug text-gray-800 line-clamp-2 min-h-[2.4rem] group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Stars */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                    strokeWidth={0}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {rating.toFixed(1)}
                <span className="text-gray-300"> ({reviewCount})</span>
              </span>
            </div>
          )}

          {/* Push price to bottom */}
          <div className="flex-1" />

          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-black text-red-600 tracking-tight">
              ${product.price.toFixed(2)}
            </span>
            {isOnSale && (
              <>
                <span className="text-xs text-gray-400 line-through font-medium">
                  ${product.originalPrice!.toFixed(2)}
                </span>
                {discountPercent >= 10 && (
                  <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                    -{discountPercent}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-0.5" />

          {/* Add to Cart — single button, always visible */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
              isOutOfStock
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-md hover:shadow-red-500/20"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}