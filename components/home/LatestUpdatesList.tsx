"use client";

import Link from "next/link";
import { useState } from "react";
import { FilePenLine, CameraOff } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

type Props = {
  items: MangaCardType[];
  limit?: number; // default 8
};

function safeText(v: unknown, fallback = "—") {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return fallback;
}

export default function LatestUpdatesList({ items, limit = 16 }: Props) {
  const display = (items ?? []).slice(0, limit);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {" "}
          {display.map((item) => {
            const key = item.id;
            const cover =
              typeof item.coverImage === "string" ? item.coverImage : "";
            const hasError = imageErrors.has(key) || !cover.trim();

            const title = safeText(item.title);
            const translator = safeText(item.translator, "ไม่ระบุ");
            const chapter = item.latestChapter ?? item.totalChapters ?? "";
            const timeLabel = safeText(item.latestUpdatedLabel, "—");

            return (
              <div key={key} className="min-w-0">
                {" "}
                <div className="flex flex-row w-full">
                  <div className="flex h-[88px] w-full">
                    {/* Cover */}
                    <Link
                      href={`/manga/${item.slug}`}
                      className="relative h-[88px] min-w-[64px] mr-3 lg:mr-4"
                      title={title}>
                      {hasError ? (
                        <div className="h-[88px] w-[64px] rounded-lg bg-muted border border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground">
                          <CameraOff className="w-4 h-4 mb-1" />
                          <span>No Image</span>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={title}
                          src={cover}
                          className="!h-[88px] !w-[64px] rounded-lg object-cover"
                          onError={() =>
                            setImageErrors((prev) => new Set(prev).add(key))
                          }
                        />
                      )}
                    </Link>

                    {/* Text */}
                    <div className="flex flex-col justify-between w-full min-w-0">
                      <div className="min-w-0">
                        <div className="flex space-x-1 items-center mb-0.5 font-medium min-w-0">
                          <Link
                            href={`/manga/${item.slug}`}
                            className="hover:text-orange-600 min-w-0"
                            title={title}>
                            <h2 className="line-clamp-1 font-semibold text-foreground">
                              {title}
                            </h2>
                          </Link>
                        </div>

                        {/* Translator */}
                        <div className="text-xs lg:text-sm">
                          <span className="flex flex-row items-center gap-1 truncate text-muted-foreground">
                            {translator}
                          </span>
                        </div>

                        {/* Chapter */}
                        <div className="text-xs lg:text-sm text-muted-foreground hover:text-orange-600 mt-0.5">
                          <span className="line-clamp-1">
                            {chapter ? `- ตอนที่ ${chapter}` : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Updated time */}
                      <div className="text-xs lg:text-sm">
                        <div
                          className="flex flex-row items-center gap-1 text-muted-foreground line-clamp-1"
                          title={timeLabel}>
                          <FilePenLine className="w-3 h-3" />
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* (optional) ปุ่มดูทั้งหมดด้านล่าง ถ้าต้องการค่อยเพิ่ม */}
      </div>
    </div>
  );
}
