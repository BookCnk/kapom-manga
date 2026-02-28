"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Info, List, BookOpen, Heart, Eye, Bookmark, MessageCircle } from "lucide-react";
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
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

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

  // Initialize likes state from manga data
  useEffect(() => {
    if (manga) {
      setLikesCount(manga._count?.likes || 0);
      
      // Check if current user already liked this manga
      const checkLikeStatus = async () => {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
          if (!token) return;
          
          const response = await fetch(`/api/manga/${manga.id}/like`, {
            method: "GET",
            headers: {
              "x-session-token": token,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setIsLiked(data.liked);
          }
        } catch (err) {
          console.error("Failed to check like status:", err);
        }
      };
      
      checkLikeStatus();
    }
  }, [manga]);

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

  const handleLikeToggle = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
      if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนกดชื่นชอบ");
        return;
      }

      const response = await fetch(`/api/manga/${manga.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

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
                    <h1 className="text-2xl font-semibold text-foreground line-clamp-1 break-words px-2">
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
                    <Heart className="w-5 h-5 text-muted-foreground fill-current" />
                    <span className="text-foreground font-semibold text-lg">{likesCount}</span>
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10 my-4"></div>

                {/* Start Reading Button */}
                <button
                  onClick={handleStartReading}
                  disabled={!continueChapter}
                  className="w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/30">
                  <span>{buttonText}</span>
                  <BookOpen className="w-4 h-4" />
                </button>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={handleLikeToggle}
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm ${
                      isLiked 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30" 
                        : "bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500"
                    }`}>
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    {isLiked ? "ชื่นชอบแล้ว" : "ชื่นชอบ"}
                  </button>
                  <button className="flex-1 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-500 flex items-center justify-center gap-2 transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    บุ๊กมาร์ก
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details & Episodes */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* แนะนำเรื่อง Header */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h2 className="text-lg font-medium text-foreground mb-4 pb-4 border-b border-border">แนะนำเรื่อง</h2>
              <div className="h-px bg-white/10 my-4 border-b border-border"></div>
              <div className="h-px bg-white/10 my-4"></div>

              {/* Tags (clickable) */}
              {manga.tags && manga.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-3 pl-0.5">
                  {manga.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/search?q=${encodeURIComponent(tag.name)}`}
                      className="px-2.5 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full hover:bg-orange-500/20 transition-colors">
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="text-sm text-muted-foreground leading-relaxed">
                {manga.description ? (
                  <div
                    className="prose prose-invert max-w-none writer-description"
                    dangerouslySetInnerHTML={{
                      __html: manga.description.replace(
                        /<a\s/g,
                        '<a target="_blank" rel="noopener noreferrer" '
                      ),
                    }}
                  />
                ) : (
                  <p>ไม่มีคำอธิบาย</p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <ReviewsSection mangaId={manga.id} creatorId={manga.creator.id} />

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
                mangaId={manga.id}
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
