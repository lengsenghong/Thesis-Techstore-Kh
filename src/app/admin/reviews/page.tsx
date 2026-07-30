"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Eye, EyeOff, Shield } from "lucide-react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { Review } from "@/types";

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", page, visibilityFilter],
    queryFn: () =>
      adminApi.reviews.list({
        page,
        limit: 20,
        ...(visibilityFilter !== "" ? { visible: visibilityFilter } : {}),
      }),
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) =>
      adminApi.reviews.toggleVisibility(id, visible),
    onSuccess: () => {
      toast.success("Review visibility updated");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: () => toast.error("Failed to update review"),
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => adminApi.reviews.delete(id),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: () => toast.error("Failed to delete review"),
  });

  const reviews: Review[] = data?.items ?? [];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} total reviews</p>
        </div>
        <select
          value={visibilityFilter}
          onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Reviews</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-base h-24 animate-pulse" />
          ))
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No reviews found</div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`card-base p-5 border transition-opacity ${
                review.isVisible === false
                  ? "opacity-50 border-border/30"
                  : "border-border/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{review.userName ?? "Anonymous"}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    {/* FIX: backend returns isVerifiedPurchase */}
                    {review.isVerifiedPurchase && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <Shield className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {review.isVisible === false && (
                      <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Hidden</span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {(review as any).productName ?? ""} ·{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>

                  {review.title && (
                    <p className="font-semibold text-sm mb-1">{review.title}</p>
                  )}
{review.body && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {review.body}
                    </p>
                  )}

                  {(review.helpfulCount ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      👍 {review.helpfulCount} found helpful
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      toggleVisibility.mutate({ id: review.id, visible: !review.isVisible })
                    }
                    disabled={toggleVisibility.isPending}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title={review.isVisible ? "Hide review" : "Show review"}
                  >
                    {review.isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this review permanently?")) {
                        deleteReview.mutate(review.id);
                      }
                    }}
                    disabled={deleteReview.isPending}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.totalPages}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
