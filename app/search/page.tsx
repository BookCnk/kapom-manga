"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/home/SearchBar";
import SearchGenreFilter from "@/components/home/SearchGenreFilter";
import SearchResultCard from "@/components/search/SearchResultCard";
import type { MangaCard } from "@/lib/mock/homeData";

// Transform manga from database to MangaCard format
function transformManga(manga: any, sales: number = 0): MangaCard {
  const mainGenre = manga.genres?.find((mg: any) => mg.genre?.parentId === null)?.genre;
  const subGenre = manga.genres?.find((mg: any) => mg.genre?.parentId !== null)?.genre;
  const genreName = subGenre?.name || mainGenre?.name || "ทั่วไป";

  // Get latest chapter
  const latestChapter = manga.chapters?.[0] || null;
  const totalChapters = manga._count?.chapters || 0;
  const latestChapterNumber = latestChapter?.number || 0;

  // Format updatedAt
  let latestUpdatedLabel = "";
  if (latestChapter?.updatedAt) {
    const updatedDate = new Date(latestChapter.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      latestUpdatedLabel = "วันนี้";
    } else if (diffDays === 1) {
      latestUpdatedLabel = "เมื่อวาน";
    } else if (diffDays < 7) {
      latestUpdatedLabel = `${diffDays} วันที่แล้ว`;
    } else {
      latestUpdatedLabel = updatedDate.toLocaleDateString("th-TH");
    }
  }

  // Format updatedAt as ISO string
  const updatedAtValue = latestChapter?.updatedAt || manga.updatedAt;
  const updatedAtString = updatedAtValue 
    ? (updatedAtValue instanceof Date ? updatedAtValue.toISOString() : String(updatedAtValue))
    : new Date().toISOString();

  return {
    id: `m-${manga.id}`,
    slug: manga.slug,
    title: manga.title,
    description: manga.description || "",
    coverImage: manga.coverUrl || "",
    views: manga.views || 0,
    rating: 0, // Rating not implemented yet
    totalChapters,
    latestChapter: latestChapterNumber,
    latestUpdatedLabel,
    updatedAt: updatedAtString,
    isNew: false,
    tags: [],
    genre: genreName as any,
    translator: manga.creator?.name || "RTN Team",
    sales,
  };
}

// ปรับข้อความให้พร้อมสำหรับค้นหา (ตัวพิมพ์เล็ก, ตัดช่องว่างส่วนเกิน)
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// รวมฟิลด์ที่เกี่ยวกับการค้นหาให้เป็นข้อความเดียว
function buildSearchText(m: MangaCard): string {
  return normalize(
    [
      m.title,
      m.description,
      m.genre,
      m.author ?? "",
      m.translator ?? "",
      ...(m.tags ?? []),
    ].join(" "),
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams?.get("q") ?? "";
  const normalizedQuery = normalize(rawQuery);
  const tokens = normalizedQuery.length
    ? normalizedQuery.split(" ").filter(Boolean)
    : [];

  const selectedGenre = (searchParams?.get("genre") ?? "all").toString();

  const [mangas, setMangas] = useState<MangaCard[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch genres
        const genresResponse = await fetch("/api/genres");
        const genresData = await genresResponse.json();
        if (genresData.success && genresData.data?.genres) {
          const genreNames = genresData.data.genres
            .filter((g: any) => !g.parentId) // Only main genres
            .map((g: any) => g.name);
          setGenres(genreNames);
        }

        // Fetch all public mangas
        // Fetch in batches to avoid performance issues
        let allMangas: any[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        while (hasMore && page <= 10) { // Limit to 10 pages (1000 mangas max)
          const params = new URLSearchParams({
            visibility: "PUBLIC",
            page: page.toString(),
            limit: limit.toString(),
          });

          const response = await fetch(`/api/manga?${params}`);
          const data = await response.json();

          if (data.success && data.data?.mangas) {
            allMangas = [...allMangas, ...data.data.mangas];
            
            // Check if there are more pages
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

        // Transform mangas to MangaCard format
        // Note: We'll use updatedAt from manga itself since we don't have chapters in the response
        const transformedMangas = allMangas.map((manga: any) => {
          const sales = manga.sales || 0;
          
          // Create a basic transform without latest chapter info
          const mainGenre = manga.genres?.find((mg: any) => mg.genre?.parentId === null)?.genre;
          const subGenre = manga.genres?.find((mg: any) => mg.genre?.parentId !== null)?.genre;
          const genreName = subGenre?.name || mainGenre?.name || "ทั่วไป";

          const totalChapters = manga._count?.chapters || 0;

          // Format updatedAt from manga
          let latestUpdatedLabel = "";
          if (manga.updatedAt) {
            const updatedDate = new Date(manga.updatedAt);
            const now = new Date();
            const diffMs = now.getTime() - updatedDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
              latestUpdatedLabel = "วันนี้";
            } else if (diffDays === 1) {
              latestUpdatedLabel = "เมื่อวาน";
            } else if (diffDays < 7) {
              latestUpdatedLabel = `${diffDays} วันที่แล้ว`;
            } else {
              latestUpdatedLabel = updatedDate.toLocaleDateString("th-TH");
            }
          }

          const updatedAtString = manga.updatedAt 
            ? (manga.updatedAt instanceof Date ? manga.updatedAt.toISOString() : String(manga.updatedAt))
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
            tags: [],
            genre: genreName as any,
            translator: manga.creator?.name || "RTN Team",
            sales,
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

  // Filter results
  const results = mangas.filter((m) => {
    const haystack = buildSearchText(m);

    // ฉลาดขึ้น: ถ้าใส่หลายคำ จะหา "ทุกเรื่องที่มีคำไหนก็ได้" ในชื่อ/รายละเอียด/แท็ก
    const matchesQuery =
      tokens.length === 0 ? true : tokens.some((t) => haystack.includes(t));

    const matchesGenre =
      !selectedGenre || selectedGenre === "all"
        ? true
        : m.genre === selectedGenre;

    return matchesQuery && matchesGenre;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title + search bar */}
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">ค้นหา</h1>

        <SearchBar
          initialQuery={rawQuery}
          className="w-full"
          autoSearch
          delayMs={1000}
        />
      </section>

      {/* Filters row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <SearchGenreFilter
          genres={genres}
          currentGenre={selectedGenre}
        />
        <button className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
          <span>สถานะ</span>
          <span className="text-[11px] text-muted-foreground">ทั้งหมด</span>
        </button>
        <button className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
          <span>ระดับเนื้อหา (Rating)</span>
          <span className="text-[11px] text-muted-foreground">ทั้งหมด</span>
        </button>
        <button className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors">
          <span>จัดเรียงตาม</span>
          <span className="text-[11px] text-muted-foreground">
            อัปเดตล่าสุด
          </span>
        </button>
      </section>

      {/* Results summary */}
      <section className="space-y-3">
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
                  สำหรับคำค้นหา{" "}
                  <span className="font-medium">"{normalizedQuery}"</span>
                </>
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => (
                <SearchResultCard key={item.id} item={item} />
              ))}
            </div>

            {results.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <p>ไม่พบผลลัพธ์</p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
