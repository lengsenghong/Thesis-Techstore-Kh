"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Search, Loader2, X,
  ImageIcon, Upload, Package, Tag, ChevronLeft,
  ChevronRight, LayoutGrid, Hash, DollarSign,
  Boxes, Sparkles, BookOpen, Star,
} from "lucide-react";
import Link from "next/link";
import { adminApi, uploadImage } from "@/lib/api";
import toast from "react-hot-toast";
import type { Product, Category } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brand { id: number; name: string; isActive: boolean; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const BADGES = [
  { value: "",         label: "None"     },
  { value: "new",      label: "New",      color: "bg-blue-50 text-blue-700 border-blue-200"     },
  { value: "sale",     label: "Sale",     color: "bg-red-50 text-red-700 border-red-200"       },
  { value: "hot",      label: "Hot",      color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "featured", label: "Featured", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

function BadgePill({ badge }: { badge?: string | null }) {
  if (!badge) return null;
  const cfg = BADGES.find((b) => b.value === badge.toLowerCase());
  if (!cfg || !cfg.value) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0)    return <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Out of stock</span>;
  if (stock <= 5)     return <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">{stock} left</span>;
  return <span className="text-xs text-muted-foreground">{stock.toLocaleString()}</span>;
}

// ── Form Field ────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400";

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const qc = useQueryClient();

  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<Product | null>(null);
  const [showBrandMgr, setShowBrandMgr] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [confirmDel,   setConfirmDel]   = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", sku: "", brand: "", price: "", originalPrice: "",
    stock: "", categoryId: "", badge: "", description: "", isFeatured: false,
    colors: [] as string[],
  });
  const [images,    setImages]    = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, search],
    queryFn:  () => adminApi.products.list({ page, limit: 20, search }),
  });

  const { data: brandsData, refetch: refetchBrands } = useQuery<Brand[]>({
    queryKey: ["admin", "brands"],
    queryFn:  () => adminApi.brands.list(),
  });
  const brands: Brand[] = brandsData ?? [];

  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn:  () => adminApi.categories.list(),
  });
  const categories: Category[] = categoriesData ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const extractMsg = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

  const createMutation = useMutation({
    mutationFn: (d: unknown) => adminApi.products.create(d),
    onSuccess: () => { toast.success("Product created"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); resetForm(); },
    onError: (e: unknown) => toast.error(extractMsg(e, "Failed to create product")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => adminApi.products.update(id, data),
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); resetForm(); },
    onError: (e: unknown) => toast.error(extractMsg(e, "Failed to update product")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.products.delete(id),
    onSuccess: () => { toast.success("Product deleted"); setConfirmDel(null); qc.invalidateQueries({ queryKey: ["admin", "products"] }); },
    onError: () => toast.error("Failed to delete product"),
  });

  const createBrandMutation = useMutation({
    mutationFn: (name: string) => adminApi.brands.create({ name }),
    onSuccess: () => { toast.success("Brand added"); setNewBrandName(""); refetchBrands(); },
    onError: (e: unknown) => toast.error(extractMsg(e, "Failed to add brand")),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: number) => adminApi.brands.delete(id),
    onSuccess: () => { toast.success("Brand deleted"); refetchBrands(); },
    onError: () => toast.error("Failed to delete brand"),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      name: "", sku: "", brand: "", price: "", originalPrice: "",
      stock: "", categoryId: "", badge: "", description: "", isFeatured: false,
      colors: [],
    });
    setImages([]);
    setColorInput("");
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku ?? "", brand: p.brand ?? "",
      price: String(p.price), originalPrice: String(p.originalPrice ?? ""),
      stock: String(p.stock ?? 0), categoryId: String(p.categoryId ?? ""),
      badge: p.badge ?? "", description: p.description ?? "", isFeatured: p.isFeatured ?? false,
      colors: (p as any)?.colors ?? [],
    });
    setImages(p.images ?? []);
    setColorInput("");
    setShowForm(true);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, url]);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !form.colors.includes(colorInput.trim())) {
      setForm({ ...form, colors: [...form.colors, colorInput.trim()] });
      setColorInput("");
    } else if (form.colors.includes(colorInput.trim())) {
      toast.error("Color already added");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryId = parseInt(form.categoryId);
    if (!form.categoryId || isNaN(categoryId) || categoryId < 1) {
      toast.error("Please select a category"); return;
    }
    const payload = {
      name: form.name, sku: form.sku || undefined, brand: form.brand || null,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      stock: parseInt(form.stock) || 0, categoryId,
      badge: form.badge ? form.badge.toUpperCase() : null,
      description: form.description || null,
      isFeatured: form.isFeatured,
      images,
      colors: form.colors.length > 0 ? form.colors : null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const products: Product[] = data?.items ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSaving   = createMutation.isPending || updateMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10.5">
            {total.toLocaleString()} total products
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBrandMgr(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-xs"
          >
            <Tag className="w-3.5 h-3.5" /> Brands
          </button>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-xs"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Categories
          </Link>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, brand, or SKU…"
          className={`${inputCls} pl-10`}
        />
      </div>

      {/* ── Products Table ────────────────────────────────────────────────── */}
      <div className="border border-border/50 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-5 py-3.5 text-left font-semibold text-foreground">Product</th>
                <th className="px-5 py-3.5 text-left font-semibold text-foreground">SKU</th>
                <th className="px-5 py-3.5 text-right font-semibold text-foreground">Price</th>
                <th className="px-5 py-3.5 text-right font-semibold text-foreground">Stock</th>
                <th className="px-5 py-3.5 text-center font-semibold text-foreground">Badge</th>
                <th className="px-5 py-3.5 text-center font-semibold text-foreground">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/25 transition-colors duration-150 group">

                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-zinc-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate max-w-[180px]">{p.name}</p>
                          {p.brand && <p className="text-xs text-muted-foreground mt-0.5">{p.brand}</p>}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-muted-foreground bg-zinc-100 px-2 py-0.5 rounded-lg">
                        {p.sku ?? "—"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5 text-right">
                      <p className="font-bold text-sm">${Number(p.price).toFixed(2)}</p>
                      {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                        <p className="text-xs text-muted-foreground line-through">
                          ${Number(p.originalPrice).toFixed(2)}
                        </p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-3.5 text-right">
                      <StockPill stock={p.stock ?? 0} />
                    </td>

                    {/* Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <BadgePill badge={p.badge} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                      }`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {confirmDel === p.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                          <span className="text-xs text-red-700 font-semibold">Delete?</span>
                          <button
                            onClick={() => deleteMutation.mutate(p.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2 py-0.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmDel(null)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setConfirmDel(p.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
              <span className="ml-1.5 text-muted-foreground/60">({total.toLocaleString()} products)</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                      p === page ? "bg-primary text-white shadow-sm shadow-primary/25" : "border border-border bg-white hover:bg-secondary text-muted-foreground"
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PRODUCT FORM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl shadow-zinc-200/80 flex flex-col max-h-[94vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{editing ? "Edit Product" : "New Product"}</h2>
                  <p className="text-xs text-muted-foreground">{editing ? editing.name : "Add to your catalog"}</p>
                </div>
              </div>
              <button onClick={resetForm} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
              <div className="space-y-5">

                {/* ── Section: Basic Info ──────────────────────────────── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Basic Info
                  </p>

                  <Field label="Product Name" required>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                      placeholder="e.g. MSI Cyborg 15 B12VE" className={inputCls} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="SKU" hint="Auto-generated if blank">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                          placeholder="e.g. MSI-0001" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Brand">
                      <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputCls}>
                        <option value="">— Select brand —</option>
                        {brands.filter((b) => b.isActive).map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3} placeholder="Product specifications and details…"
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                <div className="border-t border-zinc-100" />

                {/* ── Section: Pricing & Inventory ─────────────────────── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Pricing & Inventory
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Price ($)" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                          required placeholder="0.00" className={`${inputCls} pl-7`} />
                      </div>
                    </Field>
                    <Field label="Original Price" hint="For strikethrough">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                          placeholder="0.00" className={`${inputCls} pl-7`} />
                      </div>
                    </Field>
                    <Field label="Stock" required>
                      <div className="relative">
                        <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                          required placeholder="0" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100" />

                {/* ── Section: Classification ───────────────────────────── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Classification
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category" required>
                      <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className={inputCls}>
                        <option value="">— Select category —</option>
                        {categories.filter((c) => c.isActive).map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Badge">
                      <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputCls}>
                        {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </Field>
                  </div>

                  {/* Featured toggle */}
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                    <div className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${form.isFeatured ? "bg-primary" : "bg-zinc-300"}`}
                      style={{ height: "22px" }}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isFeatured ? "translate-x-[18px]" : ""}`} />
                    </div>
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="sr-only" />
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" /> Featured Product
                      </p>
                      <p className="text-xs text-muted-foreground">Shown in the Featured Products section</p>
                    </div>
                  </label>
                </div>

                <div className="border-t border-zinc-100" />

                {/* ── Section: Product Colors ───────────────────────────── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Product Colors
                  </p>

                  <Field label="Available Colors" hint="Add color options for this product">
                    <div className="space-y-2">
                      {/* Color input row */}
                      <div className="flex gap-2">
                        <input
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="e.g. Black, Silver, Blue, Red…"
                          className={inputCls}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && colorInput.trim()) {
                              e.preventDefault();
                              handleAddColor();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm shadow-primary/20"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>

                      {/* Display added colors */}
                      {form.colors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
                            >
                              {color}
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, colors: form.colors.filter((_, i) => i !== idx) })}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {form.colors.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No colors added yet. Add colors to allow customers to choose.</p>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="border-t border-zinc-100" />

                {/* ── Section: Images ───────────────────────────────────── */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Product Images
                  </p>

                  {/* Existing images */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative group w-20 h-20 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Product ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-zinc-200" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-primary text-white rounded-b-xl py-0.5">
                              Main
                            </span>
                          )}
                          <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center shadow-sm">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload area */}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-200 hover:border-primary/40 hover:bg-primary/3 text-sm text-muted-foreground hover:text-primary transition-all disabled:opacity-50">
                    {uploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><Upload className="w-4 h-4" /> Upload image (max 10 MB)</>
                    }
                  </button>
                  {images.length > 0 && (
                    <p className="text-xs text-muted-foreground">First image is the main product photo.</p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 shrink-0">
              <button type="button" onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="" onClick={handleSubmit} disabled={isSaving || uploading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BRAND MANAGER MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showBrandMgr && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowBrandMgr(false)}
        >
          <div className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl shadow-zinc-200/80 flex flex-col max-h-[80vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="font-bold text-base">Manage Brands</h2>
              </div>
              <button onClick={() => setShowBrandMgr(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new */}
            <div className="px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Add New Brand</p>
              <div className="flex gap-2">
                <input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. ASUS, Corsair, Razer…"
                  className={`${inputCls} flex-1`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newBrandName.trim()) { e.preventDefault(); createBrandMutation.mutate(newBrandName.trim()); }
                  }}
                />
                <button
                  onClick={() => { if (newBrandName.trim()) createBrandMutation.mutate(newBrandName.trim()); }}
                  disabled={createBrandMutation.isPending || !newBrandName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm shadow-primary/20"
                >
                  {createBrandMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </div>

            {/* Brand list */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Tag className="w-8 h-8 text-zinc-200 mb-2" />
                  <p className="text-sm text-muted-foreground">No brands yet. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all group">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${b.isActive ? "bg-emerald-400" : "bg-zinc-300"}`} />
                        <span className={`text-sm font-medium ${!b.isActive ? "line-through text-muted-foreground" : ""}`}>
                          {b.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => adminApi.brands.update(b.id, { isActive: !b.isActive }).then(() => refetchBrands())}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors"
                        >
                          {b.isActive ? "✓" : "○"}
                        </button>
                        <button
                          onClick={() => deleteBrandMutation.mutate(b.id)}
                          disabled={deleteBrandMutation.isPending}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          {deleteBrandMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}