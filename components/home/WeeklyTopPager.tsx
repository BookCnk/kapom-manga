"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Eye, BookOpen, TrendingUp, Heart } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

type Props = {
  items: MangaCardType[];
  kind: "bestSellers" | "mostLiked";
  perPage?: number;
};

function RankBadge({ rank, kind }: { rank: number; kind: "bestSellers" | "mostLiked" }) {
  const baseColor = kind === "mostLiked" ? "#F43F5E" : "#F97316";

  const getColors = () => {
    if (rank === 1) return { bg: "#F59E0B", border: "#B45309" };
    if (rank === 2) return { bg: "#94A3B8", border: "#475569" };
    if (rank === 3) return { bg: "#FB923C", border: "#C2410C" };
    return { bg: baseColor, border: baseColor };
  };

  const colors = getColors();

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md"
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`,
        border: `2px solid ${colors.border}`,
        color: "#FFFFFF",
      }}
    >
      {rank}
    </div>
  );
}

function formatViews(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default function WeeklyTopPager({ items, kind, perPage = 6 }: Props) {
  const top20 = useMemo(() => (items ?? []).slice(0, 20), [items]);
  const pageCount = Math.max(1, Math.ceil(top20.length / perPage));
  const [page, setPage] = useState(0);

  const start = page * perPage;
  const pageItems = top20.slice(start, start + perPage);

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  const accentColor = kind === "bestSellers" ? "orange" : "rose";
  const accentHex = kind === "bestSellers" ? "#F97316" : "#F43F5E";

  const openProfile = useCallback((username: string) => {
    if (!username) {
      return;
    }
    window.open(`/profile/${username}`, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="relative p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: perPage }).map((_, idx) => {
              const item = pageItems[idx];
              const rank = start + idx + 1;

              if (!item) {
                return (
                  <div
                    key={`empty-${page}-${idx}`}
                    className="h-[100px] rounded-xl border border-border/40 bg-transparent"
                  />
                );
              }

              const comicUrl = `/comic/${item.slug}`;

              return (
                <div
                  key={item.id}
                  className={[
                    "group relative flex items-stretch rounded-xl border border-border/60 bg-background overflow-hidden",
                    "hover:border-orange-500/50 hover:ring-1 hover:ring-orange-500/30",
                    "transition-all",
                  ].join(" ")}
                  style={{ minHeight: "100px" }}
                >
                  {/* Rank badge */}
                  <div className="w-12 flex items-center justify-center shrink-0 bg-muted/30">
                    <RankBadge rank={rank} kind={kind} />
                  </div>

                  {/* Cover image - clickable */}
                  <Link
                    href={comicUrl}
                    className="w-16 shrink-0 relative overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImage}
                      alt={item.title || "Cover"}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                    {/* Top section: Title + Author + Genre */}
                    <div className="space-y-1.5">
                      {/* Title - ALWAYS VISIBLE */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={comicUrl}
                          className={[
                            "block text-sm font-semibold text-foreground truncate transition-colors flex-1",
                            kind === "bestSellers"
                              ? "hover:text-orange-400"
                              : "hover:text-rose-400",
                          ].join(" ")}
                        >
                          {item.title || "ไม่มีชื่อ"}
                        </Link>
                        {item.isCompleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20 flex-shrink-0">
                            จบ
                          </span>
                        )}
                      </div>

                      {/* Author with avatar - clickable for profile */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const username = item.creatorUsername || (item.creatorId ? String(item.creatorId) : undefined) || item.translator;
                            if (username) {
                              openProfile(username);
                            }
                          }}
                          className="relative z-10 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-400 transition-colors cursor-pointer group/author"
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white group-hover/author:scale-110 group-hover/author:ring-2 group-hover/author:ring-orange-500/50 transition-all"
                            style={{
                              background: `linear-gradient(135deg, ${accentHex} 0%, #EA580C 100%)`,
                            }}
                          >
                            {(item.translator || "RTN").charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate max-w-[120px]">
                            {item.translator || "RTN Team"}
                          </span>
                        </button>

                        {/* Genre badges - main and sub */}
                        {item.genres && item.genres.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {item.genres.map((g, i) => (
                              <span key={i}>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: kind === "bestSellers" ? "rgba(249,115,22,0.15)" : "rgba(244,63,94,0.15)",
                                    color: accentHex,
                                  }}
                                >
                                  {g}
                                </span>
                                {i < item.genres!.length - 1 && (
                                  <span className="text-[10px] text-muted-foreground mx-0.5">x</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : item.genre ? (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: kind === "bestSellers" ? "rgba(249,115,22,0.15)" : "rgba(244,63,94,0.15)",
                              color: accentHex,
                            }}
                          >
                            {item.genre}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border/60 my-2" />

                    {/* Bottom: Meta stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {item.totalChapters} ตอน
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatViews(item.views)}
                      </span>
                      {kind === "mostLiked" && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          {formatViews(item.likes || 0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Invisible overlay for card click (excludes interactive elements) */}
                  <Link
                    href={comicUrl}
                    className="absolute inset-0 z-0"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          {pageCount > 1 && (
            <>
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={[
                  "absolute left-2 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full border border-border bg-card/90 backdrop-blur",
                  "flex items-center justify-center shadow-sm",
                  canPrev
                    ? "hover:bg-accent transition-colors cursor-pointer"
                    : "opacity-40 cursor-not-allowed",
                ].join(" ")}
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className={[
                  "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full border border-border bg-card/90 backdrop-blur",
                  "flex items-center justify-center shadow-sm",
                  canNext
                    ? "hover:bg-accent transition-colors cursor-pointer"
                    : "opacity-40 cursor-not-allowed",
                ].join(" ")}
                aria-label="ถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-3 py-1 rounded-full border border-border bg-background/60 font-medium">
                  หน้า {page + 1}/{pageCount}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
