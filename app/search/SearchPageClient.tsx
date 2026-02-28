"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/home/SearchBar";
import SearchGenreFilter from "@/components/home/SearchGenreFilter";
import SearchFilterDropdown from "@/components/home/SearchFilterDropdown";
import SearchResultCard from "@/components/search/SearchResultCard";
import type { MangaCard } from "@/lib/mock/homeData";
import { getGenreBySlug, mainGenres } from "@/lib/config/genres";

const ITEMS_PER_PAGE = 12;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getPlainTextFromHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.innerText || tmp.textContent || "").trim();
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
  const selectedStatus = (searchParams?.get("status") ?? "all").toString();
  const selectedRating = (searchParams?.get("rating") ?? "all").toString();
  const selectedSort = (searchParams?.get("sort") ?? "latest").toString();
  
  // Convert slug to genre name for filtering
  const selectedGenre = selectedGenreSlug === "all" 
    ? null 
    : (getGenreBySlug(selectedGenreSlug)?.name ?? null);

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
          // Handle both array format and comma-separated string format
          let genreSlugs: string[] = [];
          if (Array.isArray(manga.genreSlugs)) {
            genreSlugs = manga.genreSlugs as string[];
          } else if (typeof manga.genreSlugs === "string") {
            // Parse comma-separated string: "action,adventure" -> ["action", "adventure"]
            genreSlugs = manga.genreSlugs.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
          
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
            description: (manga.synopsis as string | null) || "",
            coverImage: manga.coverUrl || "",
            views: manga.views || 0,
            rating: 0,
            totalChapters,
            latestChapter: totalChapters,
            latestUpdatedLabel,
            updatedAt: updatedAtString,
            isNew: false,
            isCompleted: manga.status === "COMPLETED", // Show "จบ" badge if completed
            tags: dbTags,
            genre: genreName as any,
            genres: genreNames, // array ของ genre names (สูงสุด 2)
            translator: manga.creator?.name || "RTN Team",
            creatorUsername: manga.creator?.username || (manga.creator?.id ? String(manga.creator.id) : undefined),
            comments: manga._count?.comments || 0, // Add comments count
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
    const matchesGenre = !selectedGenre ? true : m.genre === selectedGenre;
    // TODO: Add status and rating filters when data is available
    const matchesStatus = selectedStatus === "all" ? true : true; // Placeholder
    const matchesRating = selectedRating === "all" ? true : true; // Placeholder
    return matchesQuery && matchesGenre && matchesStatus && matchesRating;
  });

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    switch (selectedSort) {
      case "popular":
        return b.views - a.views; // Most views first
      case "latest":
      default:
        // Handle undefined updatedAt safely
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    }
  });

  // Lazy load: แสดงผลทีละ ITEMS_PER_PAGE รายการ
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount เมื่อ results เปลี่ยน (เช่น เปลี่ยนคำค้นหาหรือ genre)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [normalizedQuery, selectedGenreSlug, selectedStatus, selectedRating, selectedSort]);

  const visibleResults = sortedResults.slice(0, visibleCount);
  const hasMore = visibleCount < sortedResults.length;

  // IntersectionObserver: โหลดเพิ่มเมื่อ scroll ถึง sentinel
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, sortedResults.length));
      }
    },
    [hasMore, sortedResults.length],
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

        <section className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full z-[100]">
          <SearchGenreFilter genres={genres} currentGenre={selectedGenreSlug} />
          <SearchFilterDropdown
            label="สถานะ"
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "ongoing", label: "ยังไม่จบ" },
              { value: "completed", label: "จบแล้ว" },
            ]}
            currentValue={selectedStatus}
            paramKey="status"
          />
          <SearchFilterDropdown
            label="ระดับเนื้อหา"
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "general", label: "ทั่วไป" },
              { value: "18+", label: "18+" },
            ]}
            currentValue={selectedRating}
            paramKey="rating"
          />
          <SearchFilterDropdown
            label="จัดเรียงตาม"
            options={[
              { value: "latest", label: "อัปเดตล่าสุด" },
              { value: "popular", label: "ยอดนิยม" },
            ]}
            currentValue={selectedSort}
            paramKey="sort"
          />
        </section>

        <section className="space-y-3 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                พบ {sortedResults.length} เรื่อง
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

              {sortedResults.length === 0 && !loading && (
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

