export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok, HttpError } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageManga,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";
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

    // Require authentication for writer pages
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin({ id: actor.id, role: actor.role });

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
        creator: { select: { id: true, name: true, email: true } },
        tagSlugs: true,
        chapters: {
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
            chapters: true,
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!manga) {
      throw new HttpError(404, "Manga not found");
    }

    // Check if user can manage this manga
    await ensureCanManageManga({ id: actor.id, role: actor.role }, manga.id);

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

    return ok({ manga: { ...manga, genres } });
  } catch (error) {
    return handleRouteError(error);
  }
}

