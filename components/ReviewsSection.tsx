"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ThumbsUp, X, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ReviewsSectionProps {
  mangaId?: number;
  contentKey?: string; // For backward compatibility with mock data
  creatorId?: number; // ID of the manga creator
}

type Review = {
  id: string;
  userId?: number;
  userName: string;
  username?: string; // For profile link
  avatarUrl: string;
  createdAt: string;
  updatedAt?: string;
  text: string;
  likes: number;
  isLiked?: boolean;
};

const PAGE_SIZE = 2;
const REVIEW_CHAR_LIMIT = 500;
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&auto=format&fit=crop";

export default function ReviewsSection({ mangaId, contentKey, creatorId }: ReviewsSectionProps) {
  type SortMode = "popular" | "latest";

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const highlightedCommentId = searchParams?.get("commentId");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReviews, setNewReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set(highlightedCommentId ? [highlightedCommentId] : [])
  );
  
  // Check if current user is the creator
  const isCreator = creatorId !== undefined && user?.id === creatorId;
  
  // For backward compatibility: use mock data if contentKey is provided and mangaId is not
  const [mockReviews] = useState(() => {
    if (contentKey && !mangaId) {
      const { getReviewsByContent } = require("@/lib/mock/reviewData");
      const mockData = getReviewsByContent(contentKey);
      return mockData.map((r: any) => ({
        id: r.id,
        userName: r.userName,
        avatarUrl: r.avatarUrl,
        createdAt: r.createdAt,
        text: r.text,
        likes: r.likes,
      }));
    }
    return [];
  });
  
  const allReviews = [...newReviews, ...reviews, ...mockReviews];

  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!mangaId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const sessionToken = localStorage.getItem("session_token") || "";
        const response = await fetch(`/api/manga/${mangaId}/comments`, {
          headers: {
            "x-session-token": sessionToken,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch reviews:", response.status, errorData);
          setReviews([]);
          return;
        }
        const data = await response.json();
        console.log("Reviews API response:", data);
        const comments = data?.data?.comments || data?.comments || [];
        console.log("Comments count:", comments.length);
        
        // Convert comments to reviews format
        const formattedReviews: Review[] = comments.map((comment: any) => ({
          id: comment.id.toString(),
          userId: comment.userId,
          userName: comment.user?.name || comment.user?.username || `ผู้ใช้ ${comment.user?.id || comment.userId}`,
          username: comment.user?.username || comment.user?.id?.toString(),
          avatarUrl: comment.user?.avatarUrl || FALLBACK_AVATAR,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt || comment.createdAt,
          text: comment.content,
          likes: comment._count?.likes || 0,
          isLiked: comment.isLiked || false,
        }));
        
        // Check if current user has a review
        if (user) {
          const currentUserReview = formattedReviews.find((r) => r.userId === user.id);
          if (currentUserReview) {
            setUserReview(currentUserReview);
          }
        }
        
        setReviews(formattedReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [mangaId]);

  // Scroll to highlighted comment when it loads
  useEffect(() => {
    if (highlightedCommentId && reviews.length > 0) {
      // Wait for DOM to update
      setTimeout(() => {
        const element = document.getElementById(`review-${highlightedCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight the review briefly
          element.classList.add("ring-2", "ring-orange-500", "rounded-lg");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-orange-500", "rounded-lg");
          }, 2000);
        }
      }, 100);
    }
  }, [highlightedCommentId, reviews]);

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

  if (loading) {
    return (
      <section className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      </section>
    );
  }

  const handleLoadMore = () => {
    // ในของจริงสามารถเปลี่ยนเป็น call API ดึงทีละ 2 ได้
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleLike = async (reviewId: string, currentLiked: boolean) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนกด like");
      return;
    }

    try {
      const sessionToken = localStorage.getItem("session_token") || "";
      const response = await fetch(`/api/comments/${reviewId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "ไม่สามารถกด like ได้");
        return;
      }

      const data = await response.json();
      const { liked, likeCount } = data?.data || {};

      // Update review in state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, isLiked: liked, likes: likeCount }
            : r
        )
      );
      setNewReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, isLiked: liked, likes: likeCount }
            : r
        )
      );
    } catch (error) {
      console.error("Error liking review:", error);
      toast.error("เกิดข้อผิดพลาดในการกด like");
    }
  };

  const openDialog = () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว");
      window.location.href = "/login";
      return;
    }
    
    // If user has existing review, load it for editing
    if (userReview) {
      setReviewText(userReview.text);
      setIsEditMode(true);
    } else {
      setReviewText("");
      setIsEditMode(false);
    }
    
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setReviewText("");
    setIsEditMode(false);
    setShowEmojiPicker(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    
    // Check if user is logged in
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว");
      window.location.href = "/login";
      return;
    }

    // If using mock data (contentKey without mangaId), use local state
    if (contentKey && !mangaId) {
      const newReview: Review = {
        id: `local-${Date.now()}`,
        userName: "Guest",
        avatarUrl: FALLBACK_AVATAR,
        createdAt: new Date().toISOString(),
        text: reviewText.trim(),
        likes: 0,
      };
      setNewReviews((prev) => [newReview, ...prev]);
      setVisibleCount((prev) => Math.max(prev, PAGE_SIZE));
      closeDialog();
      return;
    }

    // Use API for real data
    if (!mangaId) {
      toast.error("ไม่สามารถส่งรีวิวได้");
      return;
    }

    try {
      const sessionToken = localStorage.getItem("session_token") || "";
      
      // If editing existing review
      if (isEditMode && userReview) {
        const response = await fetch(`/api/comments/${userReview.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            content: reviewText.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to update review:", errorData);
          toast.error(errorData.message || "ไม่สามารถแก้ไขรีวิวได้ กรุณาลองใหม่อีกครั้ง");
          return;
        }

        const data = await response.json();
        const comment = data?.data?.comment || data?.comment;
        
        if (comment) {
          const updatedReview: Review = {
            id: comment.id.toString(),
            userId: comment.userId,
            userName: comment.user?.name || comment.user?.username || `ผู้ใช้ ${comment.user?.id}`,
            username: comment.user?.username || comment.user?.id?.toString(),
            avatarUrl: comment.user?.avatarUrl || FALLBACK_AVATAR,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            text: comment.content,
            likes: userReview.likes,
          };

          // Update in reviews list
          setReviews((prev) => 
            prev.map((r) => r.id === userReview.id ? updatedReview : r)
          );
          setUserReview(updatedReview);
          toast.success("แก้ไขรีวิวสำเร็จ");
          closeDialog();
        }
      } else {
        // Create new review
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            mangaId,
            content: reviewText.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to submit review:", errorData);
          toast.error(errorData.message || "ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่อีกครั้ง");
          return;
        }

        const data = await response.json();
        const comment = data?.data?.comment || data?.comment;
        
        if (comment) {
          const newReview: Review = {
            id: comment.id.toString(),
            userId: comment.userId,
            userName: comment.user?.name || comment.user?.username || `ผู้ใช้ ${comment.user?.id}`,
            username: comment.user?.username || comment.user?.id?.toString(),
            avatarUrl: comment.user?.avatarUrl || FALLBACK_AVATAR,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            text: comment.content,
            likes: 0,
          };

          setReviews((prev) => [newReview, ...prev]);
          setUserReview(newReview);
          setVisibleCount((prev) => Math.max(prev, PAGE_SIZE));
          toast.success("ส่งรีวิวสำเร็จ");
          closeDialog();
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("เกิดข้อผิดพลาดในการส่งรีวิว");
    }
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

            {!isCreator && user && (
              <button
                type="button"
                onClick={openDialog}
                className="rounded-full bg-foreground text-background text-xs font-medium px-4 py-1.5 hover:bg-foreground/90 transition-colors"
              >
                {userReview ? "แก้ไขรีวิว" : "เขียนรีวิว"}
              </button>
            )}
          </div>
        </div>

        {/* Review list */}
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">กำลังโหลดรีวิว...</p>
          </div>
        ) : total === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">ยังไม่มีรีวิว</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleReviews.map((review) => (
                <div
                  key={review.id}
                  id={`review-${review.id}`}
                  className={highlightedCommentId === review.id ? "transition-all duration-300" : ""}
                >
                  <ReviewItem 
                    review={review}
                    isExpanded={expandedReviews.has(review.id)}
                    onToggleExpand={() => {
                      setExpandedReviews((prev) => {
                        const next = new Set(prev);
                        if (next.has(review.id)) {
                          next.delete(review.id);
                        } else {
                          next.add(review.id);
                        }
                        return next;
                      });
                    }}
                    onLike={handleLike}
                  />
                </div>
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
          </>
        )}
      </section>

      {/* Write review dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            {/* Dialog header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                {isEditMode ? "แก้ไขรีวิว" : "เขียนรีวิว"}
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
            <div className="relative">
              <textarea
                className="w-full min-h-[160px] rounded-xl border border-border bg-muted/40 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none break-words"
                placeholder="คุณคิดเห็นยังไงกับเรื่องนี้"
                maxLength={REVIEW_CHAR_LIMIT}
                value={reviewText}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= REVIEW_CHAR_LIMIT) {
                    setReviewText(value);
                  }
                }}
              />
              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 bottom-2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="เพิ่มอีโมจิ"
              >
                <Smile className="w-4 h-4" />
              </button>
              
              {/* Emoji picker popup */}
              {showEmojiPicker && (
                <>
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 z-[70] w-72 bg-card border border-border rounded-xl shadow-xl p-3">
                    <div className="text-xs font-medium text-foreground mb-2 pb-2 border-b border-border">
                      เลือกอีโมจิ
                    </div>
                    <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {[
                        "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
                        "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
                        "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛",
                        "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
                        "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
                        "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷",
                        "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "😶‍🌫️",
                        "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭",
                        "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
                        "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪",
                        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
                        "💯", "🔥", "⭐", "🌟", "✨", "💫", "💥", "💢",
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            if (reviewText.length + emoji.length <= REVIEW_CHAR_LIMIT) {
                              setReviewText((prev) => prev + emoji);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
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

function ReviewItem({ 
  review, 
  isExpanded, 
  onToggleExpand,
  onLike
}: { 
  review: Review; 
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLike: (reviewId: string, currentLiked: boolean) => void;
}) {
  const isEdited = review.updatedAt && review.updatedAt !== review.createdAt;
  const shouldTruncate = !isExpanded;
  const textLines = review.text.split('\n');
  const hasMultipleLines = textLines.length > 2 || review.text.length > 150;
  
  const profileHref = review.username 
    ? `/profile/${review.username}` 
    : review.userId 
    ? `/profile/${review.userId}` 
    : null;

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
      {/* Avatar - Clickable */}
      {profileHref ? (
        <Link
          href={profileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center text-orange-400 text-sm font-semibold shrink-0 hover:ring-2 hover:ring-orange-500/50 transition-all cursor-pointer">
          {review.avatarUrl && review.avatarUrl !== FALLBACK_AVATAR ? (
            <Image
              src={review.avatarUrl}
              alt={review.userName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            review.userName.charAt(0).toUpperCase()
          )}
        </Link>
      ) : (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center text-orange-400 text-sm font-semibold shrink-0">
          {review.avatarUrl && review.avatarUrl !== FALLBACK_AVATAR ? (
            <Image
              src={review.avatarUrl}
              alt={review.userName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            review.userName.charAt(0).toUpperCase()
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            {profileHref ? (
              <Link
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-orange-500 transition-colors cursor-pointer">
                {review.userName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {review.userName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(review.createdAt)}
              {isEdited && (
                <span className="ml-1 text-muted-foreground/70">(แก้ไขแล้ว)</span>
              )}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike(review.id, review.isLiked || false);
            }}
            className={cn(
              "inline-flex items-center gap-1 text-xs transition-colors",
              review.isLiked
                ? "text-orange-600 hover:text-orange-700"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <ThumbsUp className={cn("w-4 h-4", review.isLiked && "fill-current")} />
            <span>{review.likes}</span>
          </button>
        </div>

        <div className="mt-1">
          {shouldTruncate && hasMultipleLines ? (
            <>
              <p className="text-sm text-foreground line-clamp-2 break-words">
                {review.text}
              </p>
              <button
                onClick={onToggleExpand}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
              >
                เพิ่มเติม
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {review.text}
              </p>
              {hasMultipleLines && (
                <button
                  onClick={onToggleExpand}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
                >
                  แสดงน้อยลง
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

