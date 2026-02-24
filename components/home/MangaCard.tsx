import Image from "next/image";
import Link from "next/link";
import { Eye, BookOpen, User } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

type Props = {
  item: MangaCardType;
  variant?: "grid" | "horizontal";
  className?: string;
  compact?: boolean;
};

function formatViews(v: number) {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default function MangaCard({
  item,
  variant = "grid",
  className,
  compact = false,
}: Props) {
  const isHorizontal = variant === "horizontal";
  const latest = item.latestChapter ?? item.totalChapters;

  return (
    <Link
      href={`/manga/${item.slug}`}
      className={[
        "group block",
        compact ? "rounded-xl" : "rounded-2xl",
        "border border-border bg-card overflow-hidden",
        "shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all",
        isHorizontal ? "flex" : "",
        className ?? "",
      ].join(" ")}>
      {/* ---------------- Cover ---------------- */}
      <div
        className={
          isHorizontal
            ? compact
              ? "relative w-[120px] sm:w-[140px] shrink-0"
              : "relative w-[160px] sm:w-[190px] shrink-0"
            : "relative"
        }>
        <div
          className={[
            "relative",
            isHorizontal ? "h-full" : "aspect-[3/4]",
          ].join(" ")}>
          <Image
            src={
              item.coverImage ||
              "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=600&auto=format&fit=crop"
            }
            alt={item.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            {item.isNew && (
              <span
                className={
                  compact
                    ? "text-[10px] px-1.5 py-0.5 rounded bg-orange-500 text-white"
                    : "text-[11px] px-2 py-0.5 rounded-md bg-orange-500 text-white shadow-sm"
                }>
                UP
              </span>
            )}

            <span
              className={
                compact
                  ? "text-[10px] px-1.5 py-0.5 rounded bg-black/55 text-white backdrop-blur"
                  : "text-[11px] px-2 py-0.5 rounded-md bg-black/55 text-white backdrop-blur"
              }>
              {item.genre}
            </span>
          </div>

          {/* Chapter badge */}
          <div className="absolute bottom-2 right-2">
            <span
              className={
                compact
                  ? "text-[10px] px-2 py-0.5 rounded bg-orange-500/90 text-white"
                  : "text-[11px] px-2.5 py-1 rounded-md bg-orange-500/90 text-white"
              }>
              ตอนที่ {latest}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- Details ---------------- */}
      <div
        className={
          compact
            ? isHorizontal
              ? "flex-1 p-2 min-w-0"
              : "p-2"
            : isHorizontal
              ? "flex-1 p-4 min-w-0"
              : "p-3"
        }>
        {/* Title */}
        <h3
          className={
            compact
              ? "text-sm font-semibold text-foreground line-clamp-1 group-hover:text-orange-600 transition-colors"
              : "text-base font-semibold text-foreground line-clamp-2 group-hover:text-orange-600 transition-colors"
          }>
          {item.title}
        </h3>

        {/* 🔥 Translator — แสดงทุกโหมด */}
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <User className={compact ? "h-3 w-3" : "h-4 w-4"} />
          <span
            className={
              compact
                ? "text-[11px] font-medium truncate"
                : "text-xs font-medium truncate"
            }>
            แปลโดย {item.translator ?? "ไม่ระบุ"}
          </span>
        </div>

        {/* Description */}
        {!compact && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* ---------------- Meta Row ---------------- */}
        <div
          className={
            compact
              ? "mt-2 flex items-center justify-between gap-2"
              : "mt-3 flex items-center justify-between gap-3"
          }>
          <div
            className={
              compact
                ? "flex items-center gap-2 text-[11px] text-muted-foreground"
                : "flex items-center gap-3 text-xs text-muted-foreground"
            }>
            <span className="inline-flex items-center gap-0.5">
              <Eye className={compact ? "h-3 w-3" : "h-4 w-4"} />
              {formatViews(item.views)}
            </span>

            <span className="inline-flex items-center gap-0.5">
              <BookOpen className={compact ? "h-3 w-3" : "h-4 w-4"} />
              {compact ? item.totalChapters : `${item.totalChapters} ตอน`}
            </span>
          </div>

          {item.latestUpdatedLabel && !compact && (
            <span className="text-xs text-muted-foreground/80 whitespace-nowrap">
              {item.latestUpdatedLabel}
            </span>
          )}
        </div>

        {/* Tags */}
        {!compact && item.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/15">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
