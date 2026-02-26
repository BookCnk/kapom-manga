"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Eye, CameraOff } from "lucide-react";
import type { MangaCard } from "@/lib/mock/homeData";

type Props = {
  item: MangaCard;
};

function formatViews(v: number) {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

function formatTimeAgoThai(updatedAt?: string, fallback?: string): string | undefined {
  if (!updatedAt) return fallback;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return fallback;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return fallback;

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;

  const years = Math.floor(months / 12);
  return `${years} ปีที่แล้ว`;
}

export default function SearchResultCard({ item }: Props) {
  const router = useRouter();

  // ผู้สร้างผลงาน: ถ้ามีทั้ง author และ translator ให้โชว์ทั้งคู่
  const primaryCreator = item.author ?? item.translator ?? "";
  const secondaryCreator =
    item.author && item.translator ? item.translator : undefined;
  const creatorUsername = item.creatorUsername;
  // แนวเรื่อง (genre): ใช้ genres array ถ้ามี ไม่เช่นนั้นใช้ genre เดียว
  const categoryNames = (item.genres && item.genres.length > 0)
    ? item.genres.slice(0, 2)
    : (item.genre ? [item.genre] : []);
  const hashTags = item.tags ?? [];
  const [hasImageError, setHasImageError] = useState(false);

  const handleCardClick = () => {
    // ใช้ path /comic แทน /content
    router.push(`/comic/${item.slug}`);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!creatorUsername) return;
    window.open(`/profile/${creatorUsername}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="group flex flex-col p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-orange-500/60 transition-colors overflow-hidden shadow-sm hover:shadow-md"
    >
      {/* แถวบน: รูป + ข้อมูลเรื่อง */}
      <div className="flex gap-4 sm:gap-5 items-start">
        <div
          className="w-28 h-36 sm:w-32 sm:h-44 flex-shrink-0 overflow-hidden bg-muted cursor-pointer rounded-lg"
          onClick={handleCardClick}
        >
          {hasImageError || !item.coverImage ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-muted/80 text-xs text-muted-foreground select-none">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center mb-1.5 relative">
                <CameraOff className="w-5 h-5" />
                <div className="absolute inset-0 rounded-full border border-border/70 border-dashed" />
              </div>
              <span className="text-[11px] tracking-tight">No Image</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.coverImage}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setHasImageError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* ชื่อเรื่อง (กดเข้าอ่านได้) */}
          <h2 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 leading-snug">
            <button
              type="button"
              onClick={handleCardClick}
              className="text-left hover:text-orange-400 transition-colors"
            >
              {item.title}
            </button>
          </h2>

          {/* Author + หมวดหมู่หลัก (ไม่เกิน 2) */}
          {(primaryCreator || categoryNames.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {primaryCreator && (
                creatorUsername ? (
                  <button
                    type="button"
                    onClick={handleCreatorClick}
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {primaryCreator}
                  </button>
                ) : (
                  <span>{primaryCreator}</span>
                )
              )}
              {secondaryCreator && (
                <>
                  <span>·</span>
                  <span>แปลโดย {secondaryCreator}</span>
                </>
              )}
              {(primaryCreator || secondaryCreator) &&
                categoryNames.length > 0 && <span>·</span>}
              {categoryNames.length > 0 && (
                <span>{categoryNames.slice(0, 2).join(" x ")}</span>
              )}
            </div>
          )}

          {/* meta: ตอน + วิว + เวลา อยู่ในกล่องพื้นหลังบาง ๆ ใต้ชื่อเรื่อง */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground border border-border/60 transition-colors group-hover:bg-orange-500/10 group-hover:text-orange-400 group-hover:border-orange-500/60">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {item.totalChapters} ตอน
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViews(item.views)}
              </span>
            </div>

            {formatTimeAgoThai(item.updatedAt, item.latestUpdatedLabel) && (
              <span className="text-xs text-muted-foreground/80 whitespace-nowrap transition-colors group-hover:text-orange-400">
                {" "}
                {formatTimeAgoThai(item.updatedAt, item.latestUpdatedLabel)}
              </span>
            )}
          </div>

          {/* คำอธิบายสั้น ๆ อยู่ด้านล่างสุดของคอลัมน์ข้อมูล */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* เส้นคั่น + แถวล่าง: แท็ก # จากนักเขียน แยกออกมาข้างล่างทั้งหมด */}
      {hashTags.length > 0 && (
        <div className="mt-3 pt-2.5 mx-1 border-t border-orange-500/40 group-hover:border-orange-500/70 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent rounded-xl pb-1 px-1 transition-colors">
          <div className="flex gap-2 text-xs text-muted-foreground min-w-max pr-1">
            {hashTags.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/60 whitespace-nowrap hover:bg-orange-500/10 hover:text-orange-400 transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

