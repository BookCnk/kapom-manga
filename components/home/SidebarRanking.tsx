"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, CameraOff, Flame, Heart } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

function formatViews(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default function SidebarRanking({ items }: { items: MangaCardType[] }) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Limit to 10 items
  const displayItems = items.slice(0, 10);

  return (
    <div
      className="
        bg-card rounded-2xl p-4 border border-border shadow-sm w-full
        lg:sticky lg:top-6
      ">
      {/* Header with unique icon */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg tracking-tight font-medium text-foreground">
          ยอดฮิตประจำสัปดาห์
        </h3>
      </div>

      {/* List - exactly 10 items */}
      <div className="space-y-4">
        {displayItems.map((item, index) => {
          const profileLink = item.creatorUsername || (item.creatorId ? String(item.creatorId) : undefined) || item.translator;
          
          // Debug logging
          console.log(`Rank ${index + 1}:`, { 
            title: item.title, 
            creatorId: item.creatorId, 
            creatorUsername: item.creatorUsername, 
            profileLink 
          });
          
          const genreText = item.genres && item.genres.length > 0
            ? item.genres.join(" x ")
            : item.genre || "ทั่วไป";

          const viewsText = typeof item.views === "number"
            ? item.views >= 1000
              ? `${(item.views / 1000).toFixed(1)}K`
              : String(item.views)
            : "0";

          const authorName = item.translator || item.author || "นักเขียน";
          const authorInitial = authorName.charAt(0).toUpperCase();

          return (
            <div
              key={item.id}
              className="flex items-center gap-3"
            >
              {/* Rank number */}
              <span
                className={`text-xl font-bold w-6 text-center shrink-0 ${
                  index === 0
                    ? "text-orange-500"
                    : index === 1
                      ? "text-slate-400"
                      : index === 2
                        ? "text-amber-600"
                        : "text-muted-foreground/40"
                }`}>
                {index + 1}
              </span>

              {/* Cover - bigger size */}
              <Link
                href={`/comic/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-22 rounded-lg bg-muted overflow-hidden shrink-0 border border-border hover:border-orange-500/50 transition-colors"
              >
                {imageErrors.has(index) ||
                  !item.coverImage ||
                  (typeof item.coverImage === "string" &&
                    item.coverImage.trim() === "") ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-muted/80 text-[8px] text-muted-foreground select-none">
                    <CameraOff className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={() =>
                      setImageErrors((prev) => new Set(prev).add(index))
                    }
                  />
                )}
              </Link>

              {/* Info - expanded to fill cover height exactly */}
              <div className="flex-1 min-w-0 h-22 flex flex-col justify-between">
                {/* Line 1: Title - aligned top */}
                <Link
                  href={`/comic/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-foreground truncate hover:text-orange-600 transition-colors leading-tight"
                >
                  {item.title}
                </Link>

                {/* Lines 2-4 container - at bottom */}
                <div className="space-y-1">

                {/* Line 2: Genre */}
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {genreText}
                </p>

                {/* Line 3: Writer profile with avatar */}
                {profileLink && (
                  <Link
                    href={`/profile/${profileLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 group/profile"
                  >
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[8px] font-medium">
                      {authorInitial}
                    </div>
                    <span className="text-xs text-muted-foreground/70 group-hover/profile:text-orange-500 transition-colors line-clamp-1">
                      {authorName}
                    </span>
                  </Link>
                )}

                {/* Line 4: Views and Likes count */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{viewsText}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{formatViews(item.likes || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
