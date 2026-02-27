export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok, HttpError } from "@/lib/api/http";
import { getGenreBySlug } from "@/lib/config/genres";

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params;

    if (!slug || typeof slug !== "string") {
      throw new HttpError(400, "Invalid slug");
    }

    console.log(`[API] Fetching manga with slug: ${slug}`);

    // Get session token from header
    const sessionToken = request.headers.get("x-session-token");
    let userId: number | null = null;
    let readingHistory: { chapterId: number; lastPage: number } | null = null;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true },
      });
      if (session) {
        userId = session.userId;
      }
    }

    const manga = await prisma.manga.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        originalTitle: true,
        description: true,
        coverUrl: true,
        bannerUrl: true,
        status: true,
        visibility: true,
        isMature: true,
        views: true,
        likesCount: true,
        genreSlugs: true,
        createdAt: true,
        updatedAt: true,
        creator: { 
          select: { 
            id: true, 
            name: true, 
            username: true 
          } 
        },
        tagSlugs: true,
        chapters: {
          where: {
            OR: [
              {
                publishedAt: {
                  lte: new Date(), // Published chapters (publishedAt <= now)
                },
              },
              {
                publishedAt: null, // Include chapters without publishedAt (for testing)
              },
            ],
          },
          select: {
            id: true,
            number: true,
            title: true,
            slug: true,
            isLocked: true,
            priceCoins: true,
            views: true,
            publishedAt: true,
            updatedAt: true,
          },
          orderBy: { number: "asc" },
        },
        _count: {
          select: {
            chapters: {
              where: {
                OR: [
                  {
                    publishedAt: {
                      lte: new Date(),
                    },
                  },
                  {
                    publishedAt: null,
                  },
                ],
              },
            },
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!manga) {
      console.log(`[API] Manga not found with slug: ${slug}`);
      throw new HttpError(404, "Manga not found");
    }

    console.log(`[API] Manga found: ${manga.title}, visibility: ${manga.visibility}`);

    // Show manga regardless of visibility (PUBLIC, UNLISTED, PRIVATE)
    // Frontend can handle visibility display if needed

    // Fetch reading history if user is logged in
    if (userId) {
      const history = await prisma.readingHistory.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId: manga.id,
          },
        },
        select: {
          chapterId: true,
          lastPage: true,
        },
      });
      if (history) {
        readingHistory = history;
      }
    }

    // Map genreSlugs to genre objects
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

    return ok({ 
      manga: { ...manga, genres },
      readingHistory: readingHistory || null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
