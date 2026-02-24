import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SearchBar from "@/components/home/SearchBar";
import SearchGenreFilter from "@/components/home/SearchGenreFilter";
import SearchResultCard from "@/components/search/SearchResultCard";
import { homeData, MangaCard } from "@/lib/mock/homeData";

type SearchPageProps = {
  searchParams: {
    q?: string;
    genre?: string;
  };
};

function getAllManga(): MangaCard[] {
  const { featured, latestUpdates, weeklyRanking, bestSellers, mostLiked } =
    homeData;

  const map = new Map<string, MangaCard>();
  for (const list of [
    featured,
    latestUpdates,
    weeklyRanking,
    bestSellers,
    mostLiked,
  ]) {
    for (const item of list) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
  }
  return Array.from(map.values());
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

export default function SearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams.q ?? "";
  const normalizedQuery = normalize(rawQuery);
  const tokens = normalizedQuery.length
    ? normalizedQuery.split(" ").filter(Boolean)
    : [];

  const selectedGenre = (searchParams.genre ?? "all").toString();
  const all = getAllManga();

  const results = all.filter((m) => {
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
    <>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title + search bar */}
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-foreground">ค้นหา</h1>

          <SearchBar
            initialQuery={searchParams.q ?? ""}
            className="w-full"
            autoSearch
            delayMs={1000}
          />
        </section>

        {/* Filters row */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <SearchGenreFilter
            genres={homeData.genres}
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
        </section>
      </main>

      <Footer />
    </>
  );
}

