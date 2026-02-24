import Image from "next/image";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SearchResultCard from "@/components/search/SearchResultCard";
import { homeData, MangaCard } from "@/lib/mock/homeData";

type AuthorPageProps = {
  params: {
    slug: string;
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

function formatViews(v: number) {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default function AuthorPage({ params }: AuthorPageProps) {
  const displayName = decodeURIComponent(params.slug);
  const all = getAllManga();

  const works = all.filter(
    (m) => m.author === displayName || m.translator === displayName,
  );

  const totalViews = works.reduce((sum, m) => sum + (m.views ?? 0), 0);

  const avatarSource =
    works[0]?.coverImage ||
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop";

  return (
    <>
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile header */}
        <section className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="relative h-32 sm:h-40 md:h-48">
            {/* banner ใช้รูปปกเรื่องแรกแบบเบลอ */}
            <Image
              src={avatarSource}
              alt={displayName}
              fill
              className="object-cover blur-sm scale-110 opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
          </div>

          <div className="px-5 sm:px-6 pb-6 -mt-10 sm:-mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-background overflow-hidden bg-muted">
                <Image
                  src={avatarSource}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                  {displayName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  ผู้สร้างสรรค์ผลงานการ์ตูนบน RTN Manga
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span>
                    ผลงานทั้งหมด{" "}
                    <span className="font-semibold">{works.length}</span> เรื่อง
                  </span>
                  <span>
                    ยอดอ่านรวม{" "}
                    <span className="font-semibold">
                      {formatViews(totalViews)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Works list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              การ์ตูนของ {displayName}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              ทั้งหมด {works.length} เรื่อง
            </span>
          </div>

          {works.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ยังไม่มีผลงานที่เชื่อมกับโปรไฟล์นี้
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {works.map((item) => (
                <SearchResultCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

