"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/home/SearchBar";
import SearchGenreFilter from "@/components/home/SearchGenreFilter";
import SearchResultCard from "@/components/search/SearchResultCard";
import type { MangaCard } from "@/lib/mock/homeData";
import { getGenreBySlug, mainGenres } from "@/lib/config/genres";

const ITEMS_PER_PAGE = 12;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildSearchText(m: MangaCard): string {
  return normalize(
    [m.title, m.description, m.genre, m.author ?? "", m.translator ?? "", ...(m.tags ?? [])].join(" "),
  );
}

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams?.get("q") ?? "";
  const normalizedQuery = normalize(rawQuery);
  const tokens = normalizedQuery.length ? normalizedQuery.split(" ").filter(Boolean) : [];
  const selectedGenreSlug = (searchParams?.get("genre") ?? "all").toString();
  
  // Convert slug to genre name for filtering
  const selectedGenre = selectedGenreSlug === "all" 
    ? "all" 
    : (getGenreBySlug(selectedGenreSlug)?.name ?? selectedGenreSlug);

  const [mangas, setMangas] = useState<MangaCard[]>([]);
  const [genres] = useState(mainGenres); // Use mainGenres from config directly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let allMangas: Array<Record<string, unknown>> = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        while (hasMore && page <= 10) {
          const params = new URLSearchParams({
            visibility: "PUBLIC",
            page: page.toString(),
            limit: limit.toString(),
          });

          const response = await fetch(`/api/manga?${params}`);
          const data = await response.json();

          if (data.success && data.data?.mangas) {
            allMangas = [...allMangas, ...data.data.mangas];

            if (data.data.pagination) {
              hasMore = page < data.data.pagination.totalPages;
              page++;
            } else {
              hasMore = data.data.mangas.length === limit;
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        const transformedMangas: MangaCard[] = allMangas.map((manga: any) => {
          // ใช้ genreSlugs (JSON array) แทน genres relation
          const genreSlugs: string[] = Array.isArray(manga.genreSlugs)
            ? (manga.genreSlugs as string[])
            : [];
          
          // แปลง slugs เป็นชื่อ genre และเลือกเฉพาะ main genres (type: "main")
          const genreNames = genreSlugs
            .map((slug) => getGenreBySlug(slug))
            .filter((genre) => genre && genre.type === "main")
            .map((genre) => genre!.name)
            .slice(0, 2); // จำกัดไว้ 2 genre
          
          // ใช้ genre แรกเป็น genre หลัก (สำหรับ backward compatibility)
          const genreName = genreNames[0] || "ทั่วไป";
          
          const totalChapters = manga._count?.chapters || 0;

          // แท็กจากฐานข้อมูล (tagSlugs: string[])
          const dbTags: string[] = Array.isArray(manga.tagSlugs)
            ? (manga.tagSlugs as string[])
            : [];

          // ใช้วันที่เพิ่มตอนล่าสุด (latestChapterAt) หรือ createdAt ของมังงะ
          // ไม่ใช้ updatedAt เพราะจะเปลี่ยนทุกครั้งที่แก้ไขข้อมูลมังงะ
          const contentDate = manga.latestChapterAt || manga.createdAt;

          let latestUpdatedLabel = "";
          if (contentDate) {
            const updatedDate = new Date(contentDate);
            const now = new Date();
            const diffMs = now.getTime() - updatedDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) latestUpdatedLabel = "วันนี้";
            else if (diffDays === 1) latestUpdatedLabel = "เมื่อวาน";
            else if (diffDays < 7) latestUpdatedLabel = `${diffDays} วันที่แล้ว`;
            else latestUpdatedLabel = updatedDate.toLocaleDateString("th-TH");
          }

          const updatedAtString = contentDate
            ? contentDate instanceof Date
              ? contentDate.toISOString()
              : String(contentDate)
            : new Date().toISOString();

          return {
            id: `m-${manga.id}`,
            slug: manga.slug,
            title: manga.title,
            description: manga.description || "",
            coverImage: manga.coverUrl || "",
            views: manga.views || 0,
            rating: 0,
            totalChapters,
            latestChapter: totalChapters,
            latestUpdatedLabel,
            updatedAt: updatedAtString,
            isNew: false,
            tags: dbTags,
            genre: genreName as any,
            genres: genreNames, // array ของ genre names (สูงสุด 2)
            translator: manga.creator?.name || "RTN Team",
            creatorUsername: manga.creator?.username || (manga.creator?.id ? String(manga.creator.id) : undefined),
          };
        });

        setMangas(transformedMangas);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setMangas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const results = mangas.filter((m) => {
    const haystack = buildSearchText(m);
    const matchesQuery = tokens.length === 0 ? true : tokens.some((t) => haystack.includes(t));
    const matchesGenre = !selectedGenre || selectedGenre === "all" ? true : m.genre === selectedGenre;
    return matchesQuery && matchesGenre;
  });

  // Lazy load: แสดงผลทีละ ITEMS_PER_PAGE รายการ
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount เมื่อ results เปลี่ยน (เช่น เปลี่ยนคำค้นหาหรือ genre)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [normalizedQuery, selectedGenreSlug]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // IntersectionObserver: โหลดเพิ่มเมื่อ scroll ถึง sentinel
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, results.length));
      }
    },
    [hasMore, results.length],
  );

  useEffect(() => {
    const option: IntersectionObserverInit = {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-foreground">ค้นหา</h1>
          <SearchBar initialQuery={rawQuery} className="w-full" autoSearch delayMs={1000} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full">
          <SearchGenreFilter genres={genres} currentGenre={selectedGenreSlug} />
          <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
            <span>สถานะ</span>
            <span className="text-[11px] text-muted-foreground">ทั้งหมด</span>
          </button>
          <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
            <span>ระดับเนื้อหา (Rating)</span>
            <span className="text-[11px] text-muted-foreground">ทั้งหมด</span>
          </button>
          <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
            <span>จัดเรียงตาม</span>
            <span className="text-[11px] text-muted-foreground">อัปเดตล่าสุด</span>
          </button>
        </section>

        <section className="space-y-3 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                พบ {results.length} เรื่อง
                {normalizedQuery && (
                  <>
                    {" "}
                    สำหรับคำค้นหา <span className="font-medium">"{normalizedQuery}"</span>
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                {visibleResults.map((item) => (
                  <SearchResultCard key={item.id} item={item} />
                ))}
              </div>

              {/* Sentinel สำหรับ infinite scroll */}
              {hasMore && (
                <div ref={loaderRef} className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-xs text-muted-foreground">กำลังโหลดเพิ่ม...</span>
                </div>
              )}

              {results.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>ไม่พบผลลัพธ์</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

