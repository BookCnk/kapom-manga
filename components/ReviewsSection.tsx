"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ThumbsUp, X } from "lucide-react";
import { getReviewsByContent, Review } from "@/lib/mock/reviewData";

interface ReviewsSectionProps {
  contentKey: string;
}

const PAGE_SIZE = 2;
const REVIEW_CHAR_LIMIT = 2000;

export default function ReviewsSection({ contentKey }: ReviewsSectionProps) {
  type SortMode = "popular" | "latest";

  // เก็บรีวิว mock เริ่มต้นไว้ใน state เดียวกันกับรีวิวที่ผู้ใช้เพิ่งเขียน
  const [initialReviews] = useState(() => getReviewsByContent(contentKey));
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const allReviews = [...userReviews, ...initialReviews];

  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");

  const sortedReviews = [...allReviews].sort((a, b) => {
    const timeDiff =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    if (sortMode === "popular") {
      // ยอดนิยม: like มากอยู่บนสุด ถ้า like เท่ากันให้รีวิวใหม่กว่าอยู่บนสุด
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      return timeDiff;
    }

    // ล่าสุด: เรียงตามเวลาที่ให้รีวิว (createdAt) ใหม่ล่าสุดอยู่บนสุด
    return timeDiff;
  });

  const total = sortedReviews.length;
  const visibleReviews = sortedReviews.slice(0, Math.min(visibleCount, total));
  const hasMore = visibleCount < total;

  if (total === 0) return null;

  const handleLoadMore = () => {
    // ในของจริงสามารถเปลี่ยนเป็น call API ดึงทีละ 2 ได้
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setReviewText("");
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;

    const newReview: Review = {
      id: `local-${Date.now()}`,
      contentKey,
      userName: "Guest",
      avatarUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&auto=format&fit=crop",
      createdAt: new Date().toISOString(),
      text: reviewText.trim(),
      likes: 0,
    };

    setUserReviews((prev) => [newReview, ...prev]);
    setVisibleCount((prev) => Math.max(prev, PAGE_SIZE));
    closeDialog();
  };

  const remainingChars = REVIEW_CHAR_LIMIT - reviewText.length;
  const isSubmitDisabled = !reviewText.trim() || remainingChars < 0;

  return (
    <>
      <section className="bg-card rounded-2xl p-5 border border-border space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              รีวิวจากนักอ่าน
            </h2>
            <p className="text-xs text-muted-foreground">
              {total} รีวิว
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>จัดเรียงตาม</span>
              <div className="inline-flex rounded-full border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setSortMode("latest")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    sortMode === "latest"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ล่าสุด
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("popular")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    sortMode === "popular"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ยอดนิยม
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={openDialog}
              className="rounded-full bg-foreground text-background text-xs font-medium px-4 py-1.5 hover:bg-foreground/90 transition-colors"
            >
              เขียนรีวิว
            </button>
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              ...เพิ่มเติม
            </button>
          </div>
        )}
      </section>

      {/* Write review dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            {/* Dialog header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                เขียนรีวิว
              </h3>
              <button
                type="button"
                onClick={closeDialog}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label + counter */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>รีวิวของคุณ</span>
              <span>
                {reviewText.length}/{REVIEW_CHAR_LIMIT}
              </span>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                className="w-full min-h-[160px] rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="คุณคิดเห็นยังไงกับเรื่องนี้"
                maxLength={REVIEW_CHAR_LIMIT}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeDialog}
                className="px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmitDisabled}
                className="px-5 py-1.5 rounded-full text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes || 1} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;

  const years = Math.floor(months / 12);
  return `${years} ปีที่แล้ว`;
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
        <Image
          src={review.avatarUrl}
          alt={review.userName}
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {review.userName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>

          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="w-3 h-3" />
            <span>{review.likes}</span>
          </button>
        </div>

        <p className="mt-1 text-sm text-foreground">{review.text}</p>
      </div>
    </div>
  );
}

