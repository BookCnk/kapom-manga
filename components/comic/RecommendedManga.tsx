"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

type RecommendedManga = {
  id: number;
  slug: string;
  title: string;
  coverUrl: string | null;
  views: number;
  likesCount: number;
  genres: Array<{ id: string; slug: string; name: string }>;
  creator: {
    id: number;
    name: string | null;
    username: string | null;
  };
  _count: {
    chapters: number;
  };
};

type Props = {
  mangaId: number;
};

function formatViews(v: number) {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=600&auto=format&fit=crop";

export default function RecommendedManga({ mangaId }: Props) {
  const [mangas, setMangas] = useState<RecommendedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("session_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["x-session-token"] = token;
        }

        const response = await fetch(`/api/manga/${mangaId}/recommended`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.mangas) {
            setMangas(data.data.mangas);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommended mangas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) {
      fetchRecommended();
    }
  }, [mangaId]);

  // Check scroll position and update button states
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    };

    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll);
      // Check on resize
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [mangas]);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Calculate scroll amount: 5 items width + gap
    // Each item is ~180px (sm) + 24px gap = ~204px per item
    // 5 items = ~1020px
    const itemWidth = 180; // sm:w-[180px]
    const gap = 24; // gap-6 = 24px
    const scrollAmount = (itemWidth + gap) * 5;

    const currentScroll = container.scrollLeft;
    const newScroll =
      direction === "right"
        ? currentScroll + scrollAmount
        : currentScroll - scrollAmount;

    container.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            การ์ตูนที่คุณอาจสนใจ!
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-[160px] sm:w-[180px] shrink-0 bg-muted rounded-xl animate-pulse"
              style={{ height: "280px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mangas.length === 0) {
    return null;
  }

  const showNavigation = mangas.length > 5;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          การ์ตูนที่คุณอาจสนใจ!
        </h2>
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg backdrop-blur-sm transition-all flex items-center justify-center ${
                canScrollLeft
                  ? "opacity-100 cursor-pointer hover:border-orange-500/50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              aria-label="เลื่อนไปทางซ้าย">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg backdrop-blur-sm transition-all flex items-center justify-center ${
                canScrollRight
                  ? "opacity-100 cursor-pointer hover:border-orange-500/50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              aria-label="เลื่อนไปทางขวา">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 -mb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div className="flex gap-4 sm:gap-6" style={{ minWidth: "max-content" }}>
            {mangas.map((manga) => {
          const coverSrc = manga.coverUrl || FALLBACK_COVER;
          const genreText =
            manga.genres.length > 0
              ? manga.genres
                  .slice(0, 2)
                  .map((g) => g.name)
                  .join(" x ")
              : "—";

          return (
            <div
              key={manga.id}
              className="w-[160px] sm:w-[180px] shrink-0 snap-start">
              <Link
                href={`/comic/${manga.slug}`}
                className="group block rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all h-full flex flex-col">
                {/* Cover */}
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  <Image
                    src={coverSrc}
                    alt={manga.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />

                  {/* Genre badge */}
                  {manga.genres.length > 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/55 text-white backdrop-blur">
                        {manga.genres[0].name}
                      </span>
                    </div>
                  )}

                  {/* Chapter badge */}
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-orange-500/90 text-white">
                      {manga._count.chapters} ตอน
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">
                    {manga.title}
                  </h3>

                  {/* Genre */}
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {genreText}
                  </p>

                  {/* Meta */}
                  <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViews(manga.views)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {manga._count.chapters}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
