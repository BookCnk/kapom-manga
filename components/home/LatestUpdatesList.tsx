"use client";

import Link from "next/link";
import { useState } from "react";
import { CameraOff, Clock, ChevronRight } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

type Props = {
  items: MangaCardType[];
  limit?: number; // default 12
  showViewAll?: boolean; // show "ดูทั้งหมด" button
};

function safeText(v: unknown, fallback = "—") {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return fallback;
}

function formatTimeAgoThai(updatedAt?: string, fallback?: string): string {
  if (!updatedAt) return fallback || "—";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return fallback || "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return fallback || "—";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;

  const years = Math.floor(months / 12);
  return `${years} ปีที่แล้ว`;
}

export default function LatestUpdatesList({ items, limit = 12, showViewAll = true }: Props) {
  const display = (items ?? []).slice(0, limit);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      {/* Header with View All button */}
      {showViewAll && (
        <div className="flex items-center justify-between">
          <div />
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors"
          >
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {display.map((item) => {
        const key = item.id;
        const cover =
          typeof item.coverImage === "string" ? item.coverImage : "";
        const hasError = imageErrors.has(key) || !cover.trim();

        const title = safeText(item.title);
        const chapter = item.latestChapter ?? item.totalChapters ?? "";
        const chapterSlug = item.latestChapterSlug;
        const chapterUrl = chapterSlug 
          ? `/comic/chapter/${chapterSlug}` 
          : `/comic/${item.slug}`;
        const authorName = item.author || item.translator || "ไม่ระบุ";
        const creatorUsername = item.creatorUsername;
        const creatorId = item.creatorId;
        // Build profile link - prefer username, fallback to id, require valid value
        const profileLink = (creatorUsername && creatorUsername.trim()) 
          ? creatorUsername 
          : (creatorId && creatorId > 0) 
            ? String(creatorId) 
            : null;
        const timeLabel = formatTimeAgoThai(item.updatedAt, item.latestUpdatedLabel);

        return (
          <div
            key={key}
            className="flex gap-3 p-2 rounded-lg border border-border/60 bg-card transition-all"
          >
            {/* Cover */}
            <Link
              href={`/comic/${item.slug}`}
              className="relative flex-shrink-0 group/cover"
              title={title}
            >
              {hasError ? (
                <div className="h-[100px] w-[70px] rounded-md bg-muted border border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground group-hover/cover:ring-2 group-hover/cover:ring-orange-500/50 transition-all">
                  <CameraOff className="w-5 h-5 mb-1" />
                  <span>No Image</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={title}
                  src={cover}
                  className="h-[100px] w-[70px] rounded-md object-cover group-hover/cover:scale-105 group-hover/cover:ring-2 group-hover/cover:ring-orange-500/50 transition-all duration-300"
                  onError={() =>
                    setImageErrors((prev) => new Set(prev).add(key))
                  }
                />
              )}
            </Link>

            {/* Info */}
            <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
              <div className="min-w-0 space-y-1">
                {/* Title - Line 1 */}
                <Link
                  href={`/comic/${item.slug}`}
                  className="block hover:text-orange-500 transition-colors group/title"
                  title={title}
                >
                  <h3 className="font-semibold text-foreground line-clamp-1 text-sm group-hover/title:text-orange-500 transition-colors">
                    {title}
                  </h3>
                </Link>

                {/* Profile + Author - Line 2 */}
                <div className="flex items-center gap-2">
                  {profileLink ? (
                    <Link
                      href={`/profile/${profileLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity group/author"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Avatar */}
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[9px] font-medium group-hover/author:ring-2 group-hover/author:ring-orange-500/50 transition-all">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-muted-foreground hover:text-orange-500 transition-colors line-clamp-1">
                        {authorName}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[9px] font-medium">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {authorName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chapter - Line 3 */}
                <Link
                  href={chapterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                >
                  {chapter ? `- ตอนที่ ${chapter}` : "-"}
                </Link>
              </div>

              {/* Time - Line 4 */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{timeLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
