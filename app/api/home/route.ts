export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import {
  Visibility,
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";
import { getGenreBySlug } from "@/lib/config/genres";

// Helper function to calculate sales for a manga
async function calculateMangaSales(mangaId: number): Promise<number> {
  const chapters = await prisma.chapter.findMany({
    where: { mangaId },
    select: { id: true },
  });
  const chapterIds = chapters.map((ch) => ch.id);

  if (chapterIds.length === 0) {
    return 0;
  }

  const purchases = await prisma.coinTransaction.findMany({
    where: {
      type: CoinTransactionType.PURCHASE,
      status: CoinTransactionStatus.SUCCESS,
    },
    select: {
      amount: true,
      metadata: true,
    },
  });

  const relevantPurchases = purchases.filter((tx) => {
    if (!tx.metadata || typeof tx.metadata !== "object") return false;
    const metadata = tx.metadata as Record<string, unknown>;
    const chapterId = metadata.chapterId;
    return typeof chapterId === "number" && chapterIds.includes(chapterId);
  });

  return relevantPurchases.reduce((sum, tx) => sum + tx.amount, 0);
}

// Helper function to calculate weekly sales for a manga
async function calculateWeeklyMangaSales(mangaId: number): Promise<number> {
  const chapters = await prisma.chapter.findMany({
    where: { mangaId },
    select: { id: true },
  });
  const chapterIds = chapters.map((ch) => ch.id);

  if (chapterIds.length === 0) {
    return 0;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const purchases = await prisma.coinTransaction.findMany({
    where: {
      type: CoinTransactionType.PURCHASE,
      status: CoinTransactionStatus.SUCCESS,
      createdAt: {
        gte: oneWeekAgo,
      },
    },
    select: {
      amount: true,
      metadata: true,
    },
  });

  const relevantPurchases = purchases.filter((tx) => {
    if (!tx.metadata || typeof tx.metadata !== "object") return false;
    const metadata = tx.metadata as Record<string, unknown>;
    const chapterId = metadata.chapterId;
    return typeof chapterId === "number" && chapterIds.includes(chapterId);
  });

  return relevantPurchases.reduce((sum, tx) => sum + tx.amount, 0);
}

// Helper function to get weekly likes count for a manga
async function getWeeklyLikesCount(mangaId: number): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const count = await prisma.like.count({
    where: {
      mangaId: mangaId,
      createdAt: {
        gte: oneWeekAgo,
      },
    },
  });

  return count;
}

// Helper function to get weekly views count for a manga (from ReadingHistory)
async function getWeeklyViewsCount(mangaId: number): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Count reading history entries created in the last week
  // Each entry represents a view/read (using createdAt to track when it was first read)
  const count = await prisma.readingHistory.count({
    where: {
      mangaId: mangaId,
      createdAt: {
        gte: oneWeekAgo,
      },
    },
  });

  return count;
}

// Transform manga to MangaCard format
function transformManga(manga: any, sales: number = 0) {
  // Map genreSlugs JSON field to main/sub genre names via config
  // Handle both array format and comma-separated string format
  let slugs: string[] = [];
  if (Array.isArray(manga.genreSlugs)) {
    slugs = manga.genreSlugs;
  } else if (typeof manga.genreSlugs === "string") {
    // Parse comma-separated string: "action,adventure" -> ["action", "adventure"]
    slugs = manga.genreSlugs.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  let mainGenreName: string | undefined;
  let subGenreName: string | undefined;

  // First slug = main genre, second slug = sub genre (regardless of config type)
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const genre = getGenreBySlug(slug);
    if (!genre) continue;
    
    if (i === 0) {
      // First slug is always main genre
      mainGenreName = genre.name;
    } else if (i === 1 && genre.name !== mainGenreName) {
      // Second slug is sub genre (if different from main)
      subGenreName = genre.name;
    }
  }

  const genreName = subGenreName || mainGenreName || "ทั่วไป";

  // Build genres array with both main and sub (up to 2)
  const genres: string[] = [];
  if (mainGenreName) genres.push(mainGenreName);
  if (subGenreName) genres.push(subGenreName);

  const latestChapter = manga.chapters?.[0] || null;
  const totalChapters = manga._count?.chapters || 0;
  const latestChapterNumber = latestChapter?.number || 0;
  const latestChapterSlug = latestChapter?.slug || "";

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
    ? updatedAtValue instanceof Date
      ? updatedAtValue.toISOString()
      : String(updatedAtValue)
    : new Date().toISOString();

  return {
    id: `m-${manga.id}`,
    slug: manga.slug,
    title: manga.title,
    description: manga.description || "",
    synopsis: manga.synopsis || "",
    coverImage: manga.coverUrl || "",
    views: manga.views || 0,
    bookmarks: manga._count?.bookmarks || 0,
    rating: 0,
    totalChapters,
    latestChapter: latestChapterNumber,
    latestChapterSlug,
    latestUpdatedLabel,
    updatedAt: updatedAtString,
    isNew: false,
    isCompleted: manga.status === "COMPLETED",
    tags: [],
    genre: genreName,
    genres,
    translator: manga.creator?.name || "RTN Team",
    creatorUsername: manga.creator?.username || undefined,
    creatorId: manga.creator?.id || undefined,
    // Debug: log creator data
    _debugCreator: manga.creator,
    likes: manga._count?.likes || 0,
    sales,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const where = {
      visibility: Visibility.PUBLIC,
    };

    // Helper to safely transform manga with error handling
    const safeTransformManga = async (manga: any) => {
      try {
        const sales = await calculateMangaSales(manga.id);
        return transformManga(manga, sales);
      } catch (err) {
        console.error(`Error transforming manga ${manga.id}:`, err);
        // Return a safe fallback
        return transformManga(manga, 0);
      }
    };

    // Featured: Latest mangas (limit 5)
    const featuredMangas = await prisma.manga
      .findMany({
        where,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching featured mangas:", err);
        return [];
      });

    // Latest Updates: Mangas with recently updated chapters (limit 12)
    const latestUpdatesMangas = await prisma.manga
      .findMany({
        where,
        take: 20,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching latest updates mangas:", err);
        return [];
      });

    // Weekly Ranking: Get ALL public mangas and calculate weekly views
    // Then sort by weekly views and take top 10
    const allMangasForRanking = await prisma.manga
      .findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching mangas for ranking:", err);
        return [];
      });

    // Calculate weekly views for all mangas and sort
    const mangasWithWeeklyViews = await Promise.all(
      allMangasForRanking.map(async (manga) => {
        const weeklyViews = await getWeeklyViewsCount(manga.id);
        return { manga, weeklyViews };
      }),
    );

    const weeklyRankingMangas = mangasWithWeeklyViews
      .sort((a, b) => b.weeklyViews - a.weeklyViews)
      .slice(0, 10)
      .map((item) => item.manga);

    // Best Sellers: Top mangas by weekly sales (limit 5)
    // Get ALL public mangas to calculate weekly sales
    const allMangasForSales = await prisma.manga
      .findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching mangas for sales:", err);
        return [];
      });

    // Calculate weekly sales for all mangas and sort
    const mangasWithWeeklySales = await Promise.all(
      allMangasForSales.map(async (manga) => {
        const weeklySales = await calculateWeeklyMangaSales(manga.id);
        return { manga, weeklySales };
      }),
    );

    const bestSellersMangas = mangasWithWeeklySales
      .sort((a, b) => b.weeklySales - a.weeklySales)
      .slice(0, 20)
      .map((item) => item.manga);

    // Most Liked: Top mangas by weekly likes (limit 5)
    // Get ALL public mangas to calculate weekly likes
    const allMangasForLikes = await prisma.manga
      .findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching mangas for likes:", err);
        return [];
      });

    // Calculate weekly likes for all mangas and sort
    const mangasWithWeeklyLikes = await Promise.all(
      allMangasForLikes.map(async (manga) => {
        const weeklyLikes = await getWeeklyLikesCount(manga.id);
        return { manga, weeklyLikes };
      }),
    );

    const mostLikedMangas = mangasWithWeeklyLikes
      .sort((a, b) => b.weeklyLikes - a.weeklyLikes)
      .slice(0, 20)
      .map((item) => item.manga);

    // Get all public mangas as fallback
    const allPublicMangas = await prisma.manga
      .findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          views: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          genreSlugs: true,
          creator: { select: { id: true, name: true, email: true, username: true } },
          chapters: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              number: true,
              slug: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch((err) => {
        console.error("Error fetching all public mangas:", err);
        return [];
      });

    // Transform all mangas with error handling
    const featured = await Promise.all(featuredMangas.map(safeTransformManga));

    // Fill featured if less than 5
    if (featured.length < 5) {
      const needed = 5 - featured.length;
      const featuredIds = new Set(featured.map((m) => m.id));
      const additional = allPublicMangas
        .filter((m) => !featuredIds.has(`m-${m.id}`))
        .slice(0, needed);
      const additionalTransformed = await Promise.all(
        additional.map(safeTransformManga),
      );
      featured.push(...additionalTransformed);
    }

    const latestUpdates = await Promise.all(
      latestUpdatesMangas.slice(0, 12).map(safeTransformManga),
    );

    // Fill latestUpdates if less than 12
    if (latestUpdates.length < 12) {
      const needed = 12 - latestUpdates.length;
      const latestIds = new Set(latestUpdates.map((m) => m.id));
      const additional = allPublicMangas
        .filter((m) => !latestIds.has(`m-${m.id}`))
        .slice(0, needed);
      const additionalTransformed = await Promise.all(
        additional.map(safeTransformManga),
      );
      latestUpdates.push(...additionalTransformed);
    }

    const weeklyRanking = await Promise.all(
      weeklyRankingMangas.map(safeTransformManga),
    );

    // Fill weeklyRanking if less than 10
    if (weeklyRanking.length < 10) {
      const needed = 10 - weeklyRanking.length;
      const rankingIds = new Set(weeklyRanking.map((m) => m.id));
      const additional = allPublicMangas
        .filter((m) => !rankingIds.has(`m-${m.id}`))
        .slice(0, needed);
      const additionalTransformed = await Promise.all(
        additional.map(safeTransformManga),
      );
      weeklyRanking.push(...additionalTransformed);
    }

    const bestSellers = await Promise.all(
      bestSellersMangas.map(safeTransformManga),
    );

    // Fill bestSellers if less than 5
    if (bestSellers.length < 20) {
      const needed = 20 - bestSellers.length;
      const sellerIds = new Set(bestSellers.map((m) => m.id));
      const additional = allPublicMangas
        .filter((m) => !sellerIds.has(`m-${m.id}`))
        .slice(0, needed);
      const additionalTransformed = await Promise.all(
        additional.map(safeTransformManga),
      );
      bestSellers.push(...additionalTransformed);
    }

    const mostLiked = await Promise.all(
      mostLikedMangas.map(safeTransformManga),
    );

    // Fill mostLiked if less than 5
    if (mostLiked.length < 20) {
      const needed = 20 - mostLiked.length;
      const likedIds = new Set(mostLiked.map((m) => m.id));
      const additional = allPublicMangas
        .filter((m) => !likedIds.has(`m-${m.id}`))
        .slice(0, needed);
      const additionalTransformed = await Promise.all(
        additional.map(safeTransformManga),
      );
      mostLiked.push(...additionalTransformed);
    }

    return ok({
      featured: featured.slice(0, 5),
      latestUpdates: latestUpdates.slice(0, 12),
      weeklyRanking: weeklyRanking.slice(0, 10),
      bestSellers: bestSellers.slice(0, 20),
      mostLiked: mostLiked.slice(0, 20),
    });
  } catch (error) {
    console.error("Error in /api/home:", error);
    return handleRouteError(error);
  }
}
