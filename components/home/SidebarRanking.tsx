"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, CameraOff } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

export default function SidebarRanking({ items }: { items: MangaCardType[] }) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  return (
    <div
      className="
        bg-card rounded-2xl p-5 border border-border shadow-sm w-full
        lg:sticky lg:top-6
        lg:h-[calc(100vh-48px)]
        overflow-hidden
      ">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg tracking-tight font-medium text-foreground">
          ยอดฮิตประจำสัปดาห์
        </h3>
      </div>

      {/* List (scroll inside the card) */}
      <div className="space-y-4 overflow-y-auto pr-1 lg:h-[calc(100%-56px-56px)]">
        {items.map((item, index) => (
          <Link
            href={`/comic/${item.slug}`}
            key={item.id}
            className="flex items-center gap-4 group">
            {index < 3 ? (
              <>
                <span
                  className={`text-2xl font-medium w-6 text-center ${
                    index === 0 ? "text-orange-500" : "text-muted-foreground/40"
                  }`}>
                  {index + 1}
                </span>

                <div className="w-14 h-20 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                  {imageErrors.has(index) ||
                  !item.coverImage ||
                  (typeof item.coverImage === "string" &&
                    item.coverImage.trim() === "") ? (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/80 text-[8px] text-muted-foreground select-none">
                      <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center mb-0.5 relative">
                        <CameraOff className="w-3 h-3" />
                        <div className="absolute inset-0 rounded-full border border-border/70 border-dashed" />
                      </div>
                      <span className="text-[8px] tracking-tight">
                        No Image
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={() =>
                        setImageErrors((prev) => new Set(prev).add(index))
                      }
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-orange-500">
                      <Star className="w-3 h-3" />
                    </span>
                    {item.rating ?? "-"}
                    <span className="mx-1">•</span> {item.genre}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-muted-foreground truncate group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-xs text-muted-foreground/80 shrink-0">
                    {item.genre}
                  </span>
                </div>
              </>
            )}
          </Link>
        ))}
      </div>

      <Link
        href="/ranking"
        className="block w-full mt-6 py-2 text-center bg-muted hover:bg-accent text-muted-foreground text-sm font-medium rounded-lg border border-border transition-colors">
        ดูอันดับทั้งหมด
      </Link>
    </div>
  );
}
