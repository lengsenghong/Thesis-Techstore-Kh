"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Image as ImageIcon,
  ExternalLink, Loader2, X, GripVertical,
  Eye, EyeOff, Megaphone, Upload, Link as LinkIcon,
  AlignLeft, Hash, ToggleLeft, ToggleRight,
} from "lucide-react";
import { adminApi, bannersApi, uploadImage } from "@/lib/api";
import type { Banner, CreateBannerRequest } from "@/types";
import toast from "react-hot-toast";

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        checked ? "bg-primary" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Form Field Wrapper ────────────────────────────────────────────────────────

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Banner Form Modal ─────────────────────────────────────────────────────────

interface BannerFormProps {
  initial?: Banner;
  onClose: () => void;
  onSave:  (data: CreateBannerRequest) => void;
  saving:  boolean;
}

function BannerForm({ initial, onClose, onSave, saving }: BannerFormProps) {
  const [title,     setTitle]     = useState(initial?.title     ?? "");
  const [subtitle,  setSubtitle]  = useState(initial?.subtitle  ?? "");
  const [imageUrl,  setImageUrl]  = useState(initial?.imageUrl  ?? "");
  const [linkUrl,   setLinkUrl]   = useState(initial?.linkUrl   ?? "");
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive,  setIsActive]  = useState(initial?.isActive  ?? true);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed — check file size and format");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())    return toast.error("Title is required");
    if (!imageUrl.trim()) return toast.error("Banner image is required");
    onSave({ title, subtitle, imageUrl, linkUrl, linkLabel, sortOrder, isActive });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl shadow-zinc-200/80 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">{initial ? "Edit Banner" : "New Banner"}</h2>
              <p className="text-xs text-muted-foreground">Hero carousel slide</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Image Upload */}
          <Field label="Banner Image" required>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Banner preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-xs font-semibold cursor-pointer hover:bg-zinc-100 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Replace
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-zinc-200 hover:border-primary/40 hover:bg-zinc-50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Drop image or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP · Max 10MB</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            {/* URL input fallback */}
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>
          </Field>

          {/* Title */}
          <Field label="Title" required hint="Displayed as headline">
            <div className="relative">
              <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Sale — Up to 40% Off"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400"
              />
            </div>
          </Field>

          {/* Subtitle */}
          <Field label="Subtitle" hint="Optional badge label">
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Limited time offer on laptops & monitors"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400"
            />
          </Field>

          {/* Link */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Link URL">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/products?badge=SALE"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400"
              />
            </Field>
            <Field label="Button Label">
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Shop Now"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all placeholder:text-zinc-400"
              />
            </Field>
          </div>

          {/* Sort Order + Active */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="flex-1">
              <label className="text-sm font-semibold block mb-1.5">Sort Order</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Toggle checked={isActive} onChange={setIsActive} />
              <div>
                <p className="text-sm font-semibold">{isActive ? "Active" : "Inactive"}</p>
                <p className="text-xs text-muted-foreground">{isActive ? "Visible on site" : "Hidden from site"}</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
          >
            {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner Card ──────────────────────────────────────────────────────────────

function BannerCard({
  banner,
  onEdit,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  banner:   Banner;
  onEdit:   () => void;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`card-base group transition-all duration-200 overflow-hidden ${
      banner.isActive ? "" : "opacity-60"
    }`}>
      <div className="flex items-stretch gap-0">

        {/* Drag handle */}
        <div className="flex items-center px-3 text-zinc-300 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Thumbnail */}
        <div className="w-28 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 my-4 relative">
          {banner.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-zinc-300" />
            </div>
          )}
          {/* Sort order badge */}
          <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
            {banner.sortOrder}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-4 px-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-sm truncate">{banner.title}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              banner.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}>
              {banner.isActive ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              {banner.isActive ? "Live" : "Hidden"}
            </span>
          </div>
          {banner.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{banner.subtitle}</p>
          )}
          {banner.linkUrl && (
            <div className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-primary/70 truncate">{banner.linkUrl}</span>
              {banner.linkLabel && (
                <span className="text-xs text-muted-foreground shrink-0">→ "{banner.linkLabel}"</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-1 pr-4 shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <span className="text-xs text-red-700 font-semibold mr-1">Delete?</span>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Toggle visibility */}
              <button
                onClick={onToggle}
                disabled={toggling}
                title={banner.isActive ? "Hide banner" : "Show banner"}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {toggling
                  ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  : banner.isActive
                    ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                    : <ToggleLeft  className="w-5 h-5 text-zinc-400" />
                }
              </button>

              {/* Edit */}
              <button
                onClick={onEdit}
                title="Edit banner"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Delete */}
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete banner"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Banner | null>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["admin", "banners"],
    queryFn:  () => bannersApi.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "banners"] });

  const createMutation = useMutation({
    mutationFn: (data: CreateBannerRequest) => adminApi.banners.create(data),
    onSuccess:  () => { toast.success("Banner created"); invalidate(); setShowForm(false); },
    onError:    () => toast.error("Failed to create banner"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBannerRequest> }) =>
      adminApi.banners.update(id, data),
    onSuccess:  () => { toast.success("Banner updated"); invalidate(); setEditing(null); setShowForm(false); },
    onError:    () => toast.error("Failed to update banner"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.banners.toggle(id),
    onSuccess:  () => { toast.success("Visibility updated"); invalidate(); },
    onError:    () => toast.error("Failed to toggle banner"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.banners.delete(id),
    onSuccess:  () => { toast.success("Banner deleted"); invalidate(); },
    onError:    () => toast.error("Failed to delete banner"),
  });

  function handleSave(data: CreateBannerRequest) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const activeCount   = banners.filter((b) => b.isActive).length;
  const inactiveCount = banners.length - activeCount;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10.5">
            Hero carousel slides shown on the homepage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats pills */}
          {banners.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                <Eye className="w-3 h-3" /> {activeCount} live
              </span>
              {inactiveCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-500">
                  <EyeOff className="w-3 h-3" /> {inactiveCount} hidden
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> New Banner
          </button>
        </div>
      </div>

      {/* ── Tip ─────────────────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
          <GripVertical className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Drag the <strong>⠿</strong> handle to reorder banners. Lower sort numbers appear first.</span>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-base overflow-hidden">
              <div className="flex items-center gap-0 p-0">
                <div className="w-10 h-28 bg-zinc-100 animate-pulse" />
                <div className="w-28 h-20 rounded-xl bg-zinc-100 animate-pulse m-4 ml-3" />
                <div className="flex-1 py-4 px-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-40 bg-zinc-100 rounded-lg animate-pulse" />
                    <div className="h-5 w-12 bg-zinc-100 rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-56 bg-zinc-100 rounded-lg animate-pulse" />
                  <div className="h-3 w-32 bg-zinc-100 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-1 pr-4">
                  {[1,2,3].map(j => <div key={j} className="w-8 h-8 bg-zinc-100 rounded-lg animate-pulse" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-zinc-300" />
          </div>
          <p className="font-bold text-base">No banners yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Create your first hero banner to display promotional slides on the homepage carousel.
          </p>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...banners]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={() => { setEditing(banner); setShowForm(true); }}
                onToggle={() => toggleMutation.mutate(banner.id)}
                onDelete={() => deleteMutation.mutate(banner.id)}
                toggling={toggleMutation.isPending}
                deleting={deleteMutation.isPending}
              />
            ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BannerForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}