export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok, HttpError } from "@/lib/api/http";
import { getGenreBySlug } from "@/lib/config/genres";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const mangaId = parseInt(params.id);
    if (isNaN(mangaId)) {
      throw new HttpError(400, "Invalid manga ID");
    }

    // Get current manga to find its genres
    const currentManga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: {
        id: true,
        genreSlugs: true,
      },
    });

    if (!currentManga) {
      throw new HttpError(404, "Manga not found");
    }

    // Get genre slugs from current manga
    const genreSlugs: string[] = Array.isArray(currentManga.genreSlugs)
      ? (currentManga.genreSlugs as string[])
      : [];

    // Get user's reading history if authenticated
    const sessionToken = request.headers.get("x-session-token");
    let userId: number | null = null;
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true },
      });
      userId = session?.userId || null;
    }

    // Build query to find similar mangas
    // Priority: 1) Same genres, 2) User's reading history, 3) Popular mangas
    let whereClause: any = {
      id: { not: mangaId }, // Exclude current manga
      visibility: "PUBLIC", // Only public mangas
    };

    // If user is logged in, try to get mangas from their reading history first
    let recommendedMangas: any[] = [];
    
    if (userId) {
      // Get mangas from user's reading history
      const historyMangas = await prisma.readingHistory.findMany({
        where: {
          userId,
          manga: {
            id: { not: mangaId },
            visibility: "PUBLIC",
          },
        },
        select: {
          manga: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
              genreSlugs: true,
              views: true,
              likesCount: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
              _count: {
                select: {
                  chapters: {
                    where: {
                      OR: [
                        { publishedAt: { lte: new Date() } },
                        { publishedAt: null },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });

      // Filter by genre if available
      const filteredHistory = historyMangas
        .map((h) => h.manga)
        .filter((manga) => {
          if (genreSlugs.length === 0) return true;
          const mangaGenres: string[] = Array.isArray(manga.genreSlugs)
            ? (manga.genreSlugs as string[])
            : [];
          return genreSlugs.some((slug) => mangaGenres.includes(slug));
        });

      recommendedMangas = filteredHistory.slice(0, 10);
    }

    // If we don't have enough from reading history, get more based on genres
    if (recommendedMangas.length < 20) {
      const remaining = 20 - recommendedMangas.length;
      
      // Get all public mangas excluding current one
      const allMangas = await prisma.manga.findMany({
        where: {
          id: { not: mangaId },
          visibility: "PUBLIC",
        },
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          genreSlugs: true,
          views: true,
          likesCount: true,
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              chapters: {
                where: {
                  OR: [
                    { publishedAt: { lte: new Date() } },
                    { publishedAt: null },
                  ],
                },
              },
            },
          },
        },
        take: 100, // Get more to filter by genre
        orderBy: { views: "desc" }, // Order by popularity
      });

      // Filter by genre and exclude already recommended
      const recommendedIds = new Set(recommendedMangas.map((m) => m.id));
      const genreFiltered = allMangas
        .filter((manga) => {
          if (recommendedIds.has(manga.id)) return false;
          if (genreSlugs.length === 0) return true;
          
          const mangaGenres: string[] = Array.isArray(manga.genreSlugs)
            ? (manga.genreSlugs as string[])
            : [];
          
          // Check if any genre matches
          return genreSlugs.some((slug) => mangaGenres.includes(slug));
        })
        .slice(0, remaining);

      recommendedMangas = [...recommendedMangas, ...genreFiltered];
    }

    // If still not enough, fill with popular mangas
    if (recommendedMangas.length < 20) {
      const remaining = 20 - recommendedMangas.length;
      const recommendedIds = new Set(recommendedMangas.map((m) => m.id));
      
      const popularMangas = await prisma.manga.findMany({
        where: {
          AND: [
            { id: { not: mangaId } },
            { id: { notIn: Array.from(recommendedIds) } },
            { visibility: "PUBLIC" },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          genreSlugs: true,
          views: true,
          likesCount: true,
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              chapters: {
                where: {
                  OR: [
                    { publishedAt: { lte: new Date() } },
                    { publishedAt: null },
                  ],
                },
              },
            },
          },
        },
        take: remaining,
        orderBy: { views: "desc" },
      });

      recommendedMangas = [...recommendedMangas, ...popularMangas];
    }

    // Limit to 20 and map genres
    const finalMangas = recommendedMangas.slice(0, 20).map((manga) => {
      const slugs: string[] = Array.isArray(manga.genreSlugs)
        ? (manga.genreSlugs as string[])
        : [];
      const genres = slugs
        .map((slug) => {
          const genre = getGenreBySlug(slug);
          return genre
            ? { id: genre.slug, slug: genre.slug, name: genre.name }
            : null;
        })
        .filter((g) => g !== null);

      return {
        ...manga,
        genres,
      };
    });

    return ok({ mangas: finalMangas });
  } catch (error) {
    return handleRouteError(error);
  }
}
