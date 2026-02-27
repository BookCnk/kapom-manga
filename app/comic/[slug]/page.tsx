"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Info, List, BookOpen, Heart, Eye, Bookmark } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import EpisodeList from "@/components/EpisodeList";
import ReviewsSection from "@/components/ReviewsSection";
import RecommendedManga from "@/components/comic/RecommendedManga";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const EPISODE_VISIBLE_LIMIT = 50;
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=600&auto=format&fit=crop";

function formatViews(v: number) {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

type Chapter = {
  id: number;
  number: number;
  title: string | null;
  slug: string;
  isLocked: boolean;
  priceCoins: number;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
};

type Tag = {
  id: number;
  name: string;
  slug: string;
};

type Genre = {
  id: string;
  slug: string;
  name: string;
};

type Manga = {
  id: number;
  slug: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  status: string;
  visibility: string;
  isMature: boolean;
  views: number;
  likesCount: number;
  genreSlugs: string[] | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    name: string | null;
    username: string | null;
  };
  tags: Array<{
    tag: Tag;
  }>;
  chapters: Chapter[];
  genres: Genre[];
  _count: {
    chapters: number;
    bookmarks: number;
    likes: number;
    comments: number;
  };
};

export default function ComicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingHistory, setReadingHistory] = useState<{ chapterId: number; lastPage: number } | null>(null);
  const [purchasedChapterIds, setPurchasedChapterIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers: HeadersInit = {};
        const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
        if (token) {
          headers["x-session-token"] = token;
        }
        const response = await fetch(`/api/manga/public/${slug}`, { headers });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", response.status, errorData);
          if (response.status === 404) {
            setError(`ไม่พบมังงะเรื่องนี้ (slug: ${slug})`);
          } else {
            setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${errorData.message || response.statusText}`);
          }
          return;
        }
        const data = await response.json();
        console.log("API Response:", data);
        
        // API returns { success: true, data: { manga: ..., readingHistory: ... } }
        const mangaData = data?.data?.manga || data?.manga;
        const historyData = data?.data?.readingHistory || null;
        console.log("Manga data:", mangaData);
        console.log("Reading history:", historyData);
        
        if (!mangaData) {
          console.error("No manga data in response:", data);
          setError("ไม่พบข้อมูลมังงะใน response");
          return;
        }
        
        console.log("Manga loaded successfully:", mangaData.title);
        setManga(mangaData);
        setReadingHistory(historyData);

        // Fetch purchased chapters if user is logged in
        if (token && mangaData.id) {
          try {
            const purchasedResponse = await fetch(`/api/manga/${mangaData.id}/purchased-chapters`, {
              headers: {
                "x-session-token": token,
              },
            });
            if (purchasedResponse.ok) {
              const purchasedData = await purchasedResponse.json();
              if (purchasedData.success && purchasedData.data?.purchasedChapterIds) {
                setPurchasedChapterIds(new Set(purchasedData.data.purchasedChapterIds));
              }
            }
          } catch (err) {
            console.error("Failed to fetch purchased chapters:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching manga:", err);
        setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchManga();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "ไม่พบมังงะนี้"}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <span>กลับหน้าแรก</span>
          </Link>
        </div>
      </div>
    );
  }

  const coverSrc = manga.coverUrl || FALLBACK_COVER;
  const chapters = manga.chapters;
  const lastChapter = chapters[chapters.length - 1];
  const lastUpdatedText = lastChapter?.publishedAt
    ? format(new Date(lastChapter.publishedAt), "d MMM yyyy HH:mm น.", { locale: th })
    : undefined;

  // Convert chapters to episodes format for EpisodeList component
  // Create a map from chapter id to chapter slug for href generation
  const chapterSlugMap = new Map(chapters.map((ch) => [ch.id.toString(), ch.slug]));
  const episodes = chapters.map((chapter) => ({
    id: chapter.id.toString(),
    number: chapter.number,
    title: chapter.title || `Episode ${chapter.number}`,
    thumbnail: "",
    date: chapter.publishedAt
      ? format(new Date(chapter.publishedAt), "d MMM yyyy HH:mm น.", { locale: th })
      : "—",
    price: chapter.priceCoins === 0 ? ("Free" as const) : chapter.priceCoins,
    isLocked: chapter.isLocked,
  }));

  const getEpisodeHref = (episodeId: string) => {
    const slug = chapterSlugMap.get(episodeId);
    return slug ? `/comic/chapter/${slug}` : "#";
  };

  const firstEpisode = episodes[0];
  const currentChapter = readingHistory 
    ? chapters.find((ch) => ch.id === readingHistory.chapterId)
    : null;
  const continueChapter = currentChapter || chapters[0];
  
  const handleStartReading = () => {
    if (continueChapter) {
      router.push(`/comic/chapter/${continueChapter.slug}`);
    }
  };

  const hasReadingHistory = readingHistory !== null;
  const buttonText = hasReadingHistory ? "อ่านต่อ" : "เริ่มอ่าน";

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "การ์ตูน", href: "/content" },
            { label: manga.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Cover & Info (Glass Background) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            {/* Glass Background using cover image */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
              <Image
                src={coverSrc}
                alt=""
                fill
                className="object-cover scale-110 blur-3xl opacity-40 saturate-150"
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
            </div>

            <div className="sticky top-24">
              <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-white/10 p-5 sm:p-6 space-y-6 min-h-[800px]">
                {/* Cover Image */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-lg border border-white/10 min-h-[400px]">
                  <Image
                    src={coverSrc}
                    alt={manga.title}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* subtle glass sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* Title */}
                <div className="text-center mb-2 min-h-[40px] flex items-center justify-center">
                  {manga ? (
                    <h1 className="text-2xl font-semibold text-foreground line-clamp-2 break-words px-2">
                      {manga.title}
                    </h1>
                  ) : (
                    <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />
                  )}
                </div>

                {/* Genre/Tags - Clickable */}
                {manga.genres && manga.genres.length > 0 && (
                  <div className="text-base text-foreground text-center font-medium mb-2">
                    {manga.genres.map((g, idx) => (
                      <span key={g.id}>
                        <Link
                          href={`/search?genre=${encodeURIComponent(g.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-orange-500 transition-colors cursor-pointer">
                          {g.name}
                        </Link>
                        {idx < manga.genres.length - 1 && " x "}
                      </span>
                    ))}
                  </div>
                )}

                {/* Author - Clickable */}
                <Link
                  href={`/profile/${manga.creator.username || manga.creator.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity group mb-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-orange-400 text-sm font-semibold group-hover:ring-2 group-hover:ring-orange-500/50 transition-all">
                    {(manga.creator.name || manga.creator.username || `ผู้ใช้ ${manga.creator.id}`).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-base text-foreground font-medium group-hover:text-orange-500 transition-colors">
                    {manga.creator.name || manga.creator.username || `ผู้ใช้ ${manga.creator.id}`}
                  </span>
                </Link>

                {/* Statistics - Larger and closer together */}
                <div className="flex items-center justify-center gap-6 text-base mb-2">
                  <span className="flex items-center gap-2">
                    <List className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground font-semibold text-lg">{manga._count?.chapters || chapters.length}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground font-semibold text-lg">{formatViews(manga.views)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground font-semibold text-lg">{manga.likesCount || manga._count?.likes || 0}</span>
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10 my-4"></div>

                {/* Start Reading Button */}
                <button
                  onClick={handleStartReading}
                  disabled={!continueChapter}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                  <span>{buttonText}</span>
                  <BookOpen className="w-4 h-4" />
                </button>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <button className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-foreground flex items-center justify-center gap-2 transition-colors text-sm">
                    <Heart className="w-4 h-4" />
                    ชื่นชอบ
                  </button>
                  <button className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-foreground flex items-center justify-center gap-2 transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    บุ๊กมาร์ก
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details & Episodes */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Tab Buttons */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-center gap-8 mb-4 border-b border-border pb-4">
                <button className="flex items-center gap-2 text-sm font-medium text-foreground border-b-2 border-foreground pb-4 -mb-4">
                  <List className="w-4 h-4" />
                  Episodes
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4">
                  <Info className="w-4 h-4" />
                  Info
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-4 -mb-4">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Tickets
                </button>
              </div>

              {/* Tags (clickable) */}
              {manga.tags && manga.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-3 pl-0.5">
                  {manga.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/search?q=${encodeURIComponent(tag.name)}`}
                      className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full hover:bg-orange-500/10 hover:text-orange-500 transition-colors">
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="text-sm text-muted-foreground leading-relaxed">
                {manga.description ? (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: manga.description }}
                  />
                ) : (
                  <p>ไม่มีคำอธิบาย</p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <ReviewsSection mangaId={manga.id} creatorId={manga.creator.id} />

            {/* Bulk Discount & Unlock */}
            <div className="flex items-center justify-between">
              <button className="px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors">
                Unlock All
              </button>
            </div>

            {/* Episode List (limit ตอนบนตาม EPISODE_VISIBLE_LIMIT) */}
            <div className="pr-2">
              <EpisodeList
                readingHistory={readingHistory}
                currentChapterId={readingHistory?.chapterId || null}
                episodes={episodes}
                visibleLimit={EPISODE_VISIBLE_LIMIT}
                lastUpdatedText={lastUpdatedText}
                getEpisodeHref={getEpisodeHref}
                mangaTitle={manga.title}
                mangaCreatorId={manga.creator.id}
                purchasedChapterIds={purchasedChapterIds}
              />
            </div>
          </div>
        </div>

        {/* Recommended Manga Section */}
        <RecommendedManga mangaId={manga.id} />
      </main>
    </>
  );
}
