"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Grid3x3,
  LayoutGrid,
  Filter,
  Sparkles,
  Tag,
  Zap,
  TrendingUp,
  Star,
  Palette,
} from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import type { Category } from "@/types";
import ProductCard from "@/components/product/ProductCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: Sparkles },
  { value: "price_asc", label: "Price: Low to High", icon: TrendingUp },
  { value: "price_desc", label: "Price: High to Low", icon: TrendingUp },
  { value: "rating", label: "Top Rated", icon: Star },
];

const BADGE_OPTIONS = [
  { value: "", label: "All", color: "gray" },
  { value: "NEW", label: "New Arrivals", color: "blue", icon: Sparkles },
  { value: "SALE", label: "On Sale", color: "red", icon: Tag },
  { value: "HOT", label: "Hot Deals", color: "orange", icon: Zap },
  { value: "FEATURED", label: "Featured", color: "purple", icon: TrendingUp },
];

const COLOR_OPTIONS = [
  { value: "", label: "All Colors", color: "gray" },
  { value: "Silver", label: "Silver", color: "gray", bgColor: "bg-gray-300" },
  { value: "Black", label: "Black", color: "black", bgColor: "bg-black" },
  { value: "White", label: "White", color: "white", bgColor: "bg-white border-2 border-gray-300" },
  { value: "Space Gray", label: "Space Gray", color: "slate", bgColor: "bg-slate-400" },
  { value: "Red", label: "Red", color: "red", bgColor: "bg-red-500" },
  { value: "Blue", label: "Blue", color: "blue", bgColor: "bg-blue-500" },
  { value: "Gold", label: "Gold", color: "yellow", bgColor: "bg-yellow-500" },
];

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border-2 border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-24 mt-3" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams?.get("search") ?? "");
  const [categorySlug, setCategorySlug] = useState(
    searchParams?.get("categorySlug") ?? ""
  );
  const [badge, setBadge] = useState(
    (searchParams?.get("badge") ?? "").toUpperCase()
  );
  const [color, setColor] = useState(searchParams?.get("color") ?? "");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");

  useEffect(() => {
    setPage(1);
  }, [search, categorySlug, badge, color, sortBy]);

  // FIX: use a lambda so React Query doesn't pass its context object directly
  // to categoriesApi.list (which previously expected { limit: number }).
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page, search, categorySlug, badge, color, sortBy }],
    queryFn: () =>
      productsApi.list({
        page,
        limit: viewMode === "large" ? 12 : 24,
        search: search || undefined,
        categorySlug: categorySlug || undefined,
        badge: badge || undefined,
        color: color || undefined,
        sortBy,
      }),
  });

  const categories: Category[] = categoriesData ?? [];
  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const updateUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  const hasActiveFilters = categorySlug || badge || search || color;

  const clearFilters = () => {
    setCategorySlug("");
    setBadge("");
    setSearch("");
    setColor("");
    router.push("/products");
  };

  const activeBadgeInfo = BADGE_OPTIONS.find((b) => b.value === badge);
  const activeColorInfo = COLOR_OPTIONS.find((c) => c.value === color);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container-wide py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1">
                Discover Products
              </h1>
              <p className="text-gray-600 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Loading products...
                  </span>
                ) : (
                  <span>
                    <span className="font-bold text-blue-600">{total}</span> products
                    {categorySlug && (
                      <span> in <span className="font-semibold">{categories.find(c => c.slug === categorySlug)?.name}</span></span>
                    )}
                    {color && (
                      <span> in <span className="font-semibold">{color}</span></span>
                    )}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white border-2 border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("large")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "large"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  aria-label="Large view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border-2 border-red-200 transition-all hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear Filters</span>
                </button>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all lg:hidden ${
                  showFilters
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Active filters:</span>
              {categorySlug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {categories.find(c => c.slug === categorySlug)?.name}
                  <button onClick={() => { setCategorySlug(""); updateUrl("categorySlug", ""); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {badge && activeBadgeInfo && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  activeBadgeInfo.color === "blue" ? "bg-blue-100 text-blue-700" :
                  activeBadgeInfo.color === "red" ? "bg-red-100 text-red-700" :
                  activeBadgeInfo.color === "orange" ? "bg-orange-100 text-orange-700" :
                  activeBadgeInfo.color === "purple" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {activeBadgeInfo.icon && <activeBadgeInfo.icon className="w-3 h-3" />}
                  {activeBadgeInfo.label}
                  <button onClick={() => { setBadge(""); updateUrl("badge", ""); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {color && activeColorInfo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                  <Palette className="w-3 h-3" />
                  {activeColorInfo.label}
                  <button onClick={() => { setColor(""); updateUrl("color", ""); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                  "{search}"
                  <button onClick={() => { setSearch(""); updateUrl("search", ""); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className={`w-72 flex-shrink-0 space-y-4 ${
              showFilters ? "block" : "hidden"
            } lg:block`}
          >
            {/* Search */}
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Search</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    updateUrl("search", e.target.value);
                  }}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Categories</h3>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategorySlug(""); updateUrl("categorySlug", ""); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !categorySlug
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategorySlug(cat.slug); updateUrl("categorySlug", cat.slug); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      categorySlug === cat.slug
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Filter */}
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Filter By</h3>
              </div>
              <div className="space-y-2">
                {BADGE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setBadge(opt.value); updateUrl("badge", opt.value); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        badge === opt.value
                          ? opt.color === "blue" ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : opt.color === "red" ? "bg-red-100 text-red-700 border-2 border-red-300"
                          : opt.color === "orange" ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                          : opt.color === "purple" ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                          : "bg-gray-100 text-gray-700 border-2 border-gray-300"
                          : "text-gray-600 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter */}
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Color</h3>
              </div>
              <div className="space-y-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setColor(opt.value); updateUrl("color", opt.value); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      color === opt.value
                        ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                        : "text-gray-600 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${opt.bgColor}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Sort By</h3>
              </div>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        sortBy === opt.value
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid gap-5 ${
                viewMode === "large"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              }`}>
                {Array.from({ length: viewMode === "large" ? 9 : 12 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-5 ${
                  viewMode === "large"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`min-w-[40px] h-10 px-3 rounded-xl text-sm font-bold transition-all ${
                                page === p
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110"
                                  : "border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 text-gray-600"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-white border-2 border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm">
                  We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}