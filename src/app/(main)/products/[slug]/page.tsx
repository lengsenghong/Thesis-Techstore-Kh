"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star, ShoppingCart, Heart, Share2, Shield, Truck, RefreshCw,
  ChevronLeft, ChevronRight, ThumbsUp, Loader2, CheckCircle,
  Package, Info, ArrowRight,
} from "lucide-react";
import { productsApi, reviewsApi, type CreateReviewRequest } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import type { Product, Review } from "@/types";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug   = params?.slug ?? "";
  const router = useRouter();
  const qc     = useQueryClient();
  const { addToCart } = useCart();

  const [activeImg, setActiveImg]         = useState(0);
  const [quantity, setQuantity]           = useState(1);
  const [activeTab, setActiveTab]         = useState<"overview" | "specs" | "reviews">("overview");
  const [reviewPage, setReviewPage]       = useState(1);
  const [isWishlisted, setIsWishlisted]   = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Review form state
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody]   = useState("");

  // ── Product ──────────────────────────────────────────────────────────────
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn:  () => productsApi.getBySlug(slug),
    enabled:  !!slug,
  });

  // ── FIX: initialize selectedColor in an effect, not during render ────────
  const getColors = (colors: unknown): string[] => {
    if (Array.isArray(colors) && colors.length > 0) return colors as string[];
    if (typeof colors === "string") {
      try { return JSON.parse(colors) as string[]; } catch {}
    }
    return [];
  };

  useEffect(() => {
    if (!product) return;
    const colors = getColors((product as any)?.colors);
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [product]);

  // ── Reviews ──────────────────────────────────────────────────────────────
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", product?.id, reviewPage],
    queryFn:  () => reviewsApi.list(product!.id, reviewPage, 5),
    enabled:  !!product?.id,
  });

  const { data: canReviewData, isLoading: canReviewLoading } = useQuery({
    queryKey: ["can-review", product?.id],
    queryFn:  () => reviewsApi.canReview(product!.id),
    enabled:  !!product?.id,
    retry:    false,
  });

  // ── More products (same category, exclude current) ───────────────────────
  const { data: moreProductsData } = useQuery({
    queryKey: ["more-products", product?.categoryId, product?.id],
    queryFn:  () =>
      productsApi.list({
        categoryId: product!.categoryId,
        page:       1,
        limit:      8,
      }),
    enabled: !!product?.categoryId,
    select: (data) => ({
      ...data,
      items: (data.items ?? []).filter((p: Product) => p.id !== product?.id),
    }),
  });

  const moreProducts: Product[] = moreProductsData?.items ?? [];

  // ── Submit review ────────────────────────────────────────────────────────
  const submitReview = useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsApi.create(data),
    onSuccess: () => {
      toast.success("Review submitted! Thank you.");
      qc.invalidateQueries({ queryKey: ["reviews", product?.id] });
      qc.invalidateQueries({ queryKey: ["can-review", product?.id] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
      setRating(0);
      setReviewTitle("");
      setReviewBody("");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Failed to submit review";
      toast.error(message);
    },
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (rating === 0) { toast.error("Please select a star rating"); return; }
    if (reviewBody.trim().length < 10) { toast.error("Review must be at least 10 characters"); return; }
    submitReview.mutate({
      productId: product.id,
      rating,
      title: reviewTitle || undefined,
      body:  reviewBody,
    });
  };

  // ── Mark helpful ──────────────────────────────────────────────────────────
  const markHelpful = useMutation({
    mutationFn: (id: number) => reviewsApi.markHelpful(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["reviews", product?.id] }),
  });

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const colors   = getColors((product as any)?.colors);
    const hasColors = colors.length > 0;
    if (hasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    addToCart(product, quantity, selectedColor || undefined);
    toast.success(`${product.name} added to cart`);
  }, [product, quantity, selectedColor, addToCart]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (productLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-muted-foreground">Product not found.</p>
        <button onClick={() => router.back()} className="text-primary hover:underline text-sm">
          ← Go Back
        </button>
      </div>
    );
  }

  const images        = product.images ?? [];
  const displayImage  = images[activeImg] ?? images[0] ?? "/placeholder-product.png";
  const isOutOfStock  = (product.stock ?? 1) === 0;
  const ratingVal     = product.rating ?? product.averageRating ?? 0;
  const reviewCount   = product.reviewCount ?? 0;
  const reviews: Review[] = reviewsData?.items ?? [];
  const colors        = getColors((product as any)?.colors);
  const hasColors     = colors.length > 0;

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <button onClick={() => router.push("/")} className="hover:text-foreground transition-colors">
          Home
        </button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push("/products")} className="hover:text-foreground transition-colors">
          Products
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-10 mb-12">

        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border/50">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow hover:bg-background transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow hover:bg-background transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    activeImg === i
                      ? "border-primary"
                      : "border-border/50 hover:border-primary/40"
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {product.brand}
            </p>
          )}

          <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(ratingVal)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {ratingVal.toFixed(1)} ({reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-red-500">
                  -{Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                  )}%
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Stock */}
          <div className="text-sm">
            {isOutOfStock ? (
              <span className="text-destructive font-medium">Out of Stock</span>
            ) : (
              <span className="text-green-600 font-medium">
                In Stock{product.stock != null ? ` (${product.stock} left)` : ""}
              </span>
            )}
          </div>

          {/* Color Selector */}
          {hasColors && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Select Color <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                      selectedColor === color
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-secondary transition-colors text-lg font-medium"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                className="px-3 py-2 hover:bg-secondary transition-colors text-lg font-medium"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            <button
              onClick={() => {
                setIsWishlisted((w) => !w);
                toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
              }}
              className="p-3 rounded-xl border border-border hover:bg-secondary transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-xl border border-border hover:bg-secondary transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Shield,    label: "Warranty" },
              { icon: Truck,     label: "Fast Delivery" },
              { icon: RefreshCw, label: "7-Day Return" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 text-center"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-border/50 mb-6">
        <div className="flex gap-1">
          {(["overview", "specs", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}{tab === "reviews" && reviewCount > 0 ? ` (${reviewCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Overview ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {product.description ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Product Description
              </h3>
              <div className="space-y-2.5">
                {product.description
                  .split(/\n|•|-/)
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0)
                  .map((line, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{line}</p>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-gray-500 text-sm">No description available for this product.</p>
            </div>
          )}

          {product.shortDescription && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
                Key Highlights
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{product.shortDescription}</p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              What's Included
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "1x " + product.name,
                "User Manual & Documentation",
                "Warranty Card",
                "Original Packaging",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Specs ──────────────────────────────────────────────────────── */}
      {activeTab === "specs" && (
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          {product.specs && Object.keys(product.specs).length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(product.specs).map(([key, val]) => (
                  <tr key={key} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 pr-6 text-muted-foreground font-medium w-44">{key}</td>
                    <td className="py-2.5">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground text-sm">No specifications available.</p>
          )}
        </div>
      )}

      {/* ── Tab: Reviews ────────────────────────────────────────────────────── */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {!canReviewLoading && canReviewData?.canReview && (
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i + 1)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            i < (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Title (optional)</label>
                  <input
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarise your experience"
                    maxLength={200}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Review *</label>
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share your experience with this product (min 10 characters)"
                    rows={4}
                    minLength={10}
                    maxLength={2000}
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {reviewBody.length}/2000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitReview.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitReview.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  {submitReview.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}

          {!canReviewLoading && canReviewData?.hasReviewed && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 text-center text-sm text-muted-foreground">
              You have already reviewed this product.
            </div>
          )}

          {!canReviewLoading && canReviewData && !canReviewData.hasPurchased && !canReviewData.hasReviewed && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 text-center text-sm text-muted-foreground">
              Purchase this product to leave a review.
            </div>
          )}

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-border/50 bg-card p-5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {(review.userName ?? "A")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{review.userName ?? "Anonymous"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                              <Shield className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.title && (
                    <p className="font-semibold text-sm">{review.title}</p>
                  )}

                  {review.body && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.body}
                    </p>
                  )}

                  <button
                    onClick={() => markHelpful.mutate(review.id)}
                    disabled={markHelpful.isPending}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpfulCount ?? 0})
                  </button>
                </div>
              ))}

              {reviewsData && reviewsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    disabled={reviewPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-sm">
                    {reviewPage} / {reviewsData.totalPages}
                  </span>
                  <button
                    onClick={() => setReviewPage((p) => p + 1)}
                    disabled={reviewPage === reviewsData.totalPages}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Browse More Products ─────────────────────────────────────────────── */}
      {moreProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              More from{" "}
              <span className="text-primary">
                {product.categoryName ?? "this category"}
              </span>
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {moreProducts.slice(0, 8).map((p) => {
              const thumb    = (p.images ?? [])[0] ?? "/placeholder-product.png";
              const pRating  = p.rating ?? p.averageRating ?? 0;
              const pReviews = p.reviewCount ?? 0;
              const pSlug    = p.slug ?? p.id;

              return (
                <Link
                  key={p.id}
                  href={`/products/${pSlug}`}
                  className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                    <Image
                      src={thumb}
                      alt={p.name}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                    {(p.stock ?? 1) === 0 && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                        -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-1.5">
                    {p.brand && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        {p.brand}
                      </p>
                    )}
                    <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {p.name}
                    </p>

                    {pReviews > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(pRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">({pReviews})</span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">
                        ${p.price.toFixed(2)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${p.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(p, 1);
                        toast.success(`${p.name} added to cart`);
                      }}
                      disabled={(p.stock ?? 1) === 0}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}