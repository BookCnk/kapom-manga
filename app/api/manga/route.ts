export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  MangaStatus,
  UserRole,
  Visibility,
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureTranslatorOrAdmin } from "@/lib/api/permissions";
import { allGenres, getGenreBySlug } from "@/lib/config/genres";
import { contentTypeValues } from "@/lib/config/contentTypes";

// zod enum ต้องการ tuple type จึงต้อง cast ให้ชัดเจน
const contentTypeEnum = z.enum(
  contentTypeValues as [string, ...string[]],
);

const createMangaSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  // จำกัดชื่อเรื่องสูงสุด 120 ตัวอักษร
  title: z.string().trim().min(1).max(120),
  // จำกัดชื่อเรื่องต้นฉบับสูงสุด 120 ตัวอักษร
  originalTitle: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  synopsis: z.string().trim().max(300).optional(),
  coverUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val && val !== "" ? val : undefined)),
  bannerUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val && val !== "" ? val : undefined)),
  status: z.nativeEnum(MangaStatus).default(MangaStatus.ONGOING),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
  isMature: z.boolean().default(false),
  contentType: contentTypeEnum.default("jp-manga"),
  genreSlugs: z.array(z.string().trim().min(1)).optional().default([]),
  tags: z.array(z.string().trim().min(1).max(20)).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const visibility = searchParams.get("visibility") as Visibility | null;
    const status = searchParams.get("status") as MangaStatus | null;
    const creatorIdRaw = searchParams.get("creatorId");
    const creatorId = creatorIdRaw
      ? Number.parseInt(creatorIdRaw, 10)
      : undefined;
    const search = searchParams.get("search") || "";
    const genreIdRaw = searchParams.get("genreId");
    const genreId = genreIdRaw ? Number.parseInt(genreIdRaw, 10) : undefined;
    const isMatureRaw = searchParams.get("isMature");
    const isMature =
      isMatureRaw === "true"
        ? true
        : isMatureRaw === "false"
          ? false
          : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Build where clause
    const whereBase: any = {};

    if (visibility && visibility in Visibility) {
      whereBase.visibility = visibility;
    }
    if (status && status in MangaStatus) {
      whereBase.status = status;
    }
    if (creatorId && Number.isInteger(creatorId) && creatorId > 0) {
      // Support legacy rows where creatorId was not set (NULL)
      // This prevents writer dashboard from showing empty results when older records exist.
      whereBase.OR = [
        { creatorId: creatorId },
        { creatorId: null },
      ];
    }
    if (isMature !== undefined) {
      whereBase.isMature = isMature;
    }

    const buildWhere = (includeSynopsis: boolean) => {
      const where: any = { ...whereBase };
      if (search) {
        const searchOr = [
          { title: { contains: search } },
          { description: { contains: search } },
          ...(includeSynopsis ? [{ synopsis: { contains: search } }] : []),
        ];
        where.OR = where.OR ? [...where.OR, ...searchOr] : searchOr;
      }
      return where;
    };

    // Add genre filter (using genreSlugs JSON field)
    if (genreId && Number.isInteger(genreId) && genreId > 0) {
      // Note: Prisma's JSON filtering is limited, so we'll filter in memory after fetching
      // For now, we'll skip genre filtering in the query and filter in memory
    }

    const buildSelect = (includeSynopsis: boolean) => {
      return {
        id: true,
        slug: true,
        title: true,
        description: true,
        ...(includeSynopsis ? { synopsis: true } : {}),
        coverUrl: true,
        status: true,
        visibility: true,
        isMature: true,
        views: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
        genreSlugs: true,
        tagSlugs: true,
        creator: { select: { id: true, name: true, email: true, username: true } },
        chapters: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
        _count: {
          select: {
            chapters: true,
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
      };
    };

    const shouldRetryWithoutSynopsis = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      return msg.toLowerCase().includes("synopsis");
    };

    let includeSynopsis = true;
    let where = buildWhere(includeSynopsis);
    let total: number;
    let mangas: any[];

    try {
      total = await prisma.manga.count({ where } as any);
      mangas = await prisma.manga.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: buildSelect(includeSynopsis),
      } as any);
    } catch (err) {
      if (!shouldRetryWithoutSynopsis(err)) {
        throw err;
      }
      includeSynopsis = false;
      where = buildWhere(includeSynopsis);
      total = await prisma.manga.count({ where } as any);
      mangas = await prisma.manga.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: buildSelect(includeSynopsis),
      } as any);
    }

    // Filter by genre if specified (in-memory filtering for JSON field)
    let filteredMangas = mangas;
    if (genreId && Number.isInteger(genreId) && genreId > 0) {
      const genre = allGenres.find((g) => g.slug === genreId.toString());
      if (genre) {
        filteredMangas = mangas.filter((manga) => {
          const slugs: string[] = Array.isArray(manga.genreSlugs)
            ? (manga.genreSlugs as string[])
            : [];
          return slugs.includes(genre.slug);
        });
      }
    }

    // Map genreSlugs to genre objects for frontend
    const mangasWithGenres = filteredMangas.map((manga) => {
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

      // ใช้วันที่สร้างตอนล่าสุด (ถ้ามี) หรือ createdAt ของมังงะ
      const latestChapterAt = manga.chapters?.[0]?.createdAt || null;

      return {
        ...manga,
        genres,
        latestChapterAt,
      };
    });

    // Calculate sales for each manga
    const mangasWithSales = await Promise.all(
      mangasWithGenres.map(async (manga) => {
        // Get all chapter IDs for this manga
        const chapters = await prisma.chapter.findMany({
          where: { mangaId: manga.id },
          select: { id: true },
        });
        const chapterIds = chapters.map((ch) => ch.id);

        if (chapterIds.length === 0) {
          return { ...manga, sales: 0 };
        }

        // Get sales from coin transactions
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
          return (
            typeof chapterId === "number" && chapterIds.includes(chapterId)
          );
        });

        const sales = relevantPurchases.reduce((sum, tx) => sum + tx.amount, 0);

        return { ...manga, sales };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return ok({
      mangas: mangasWithSales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin({ id: actor.id, role: actor.role as UserRole });

    const body = createMangaSchema.parse(await request.json());

    // Validate genre slugs
    const genreSlugs = Array.isArray(body.genreSlugs) ? body.genreSlugs : [];
    for (const slug of genreSlugs) {
      if (!getGenreBySlug(slug)) {
        throw new Error(`Invalid genre slug: ${slug}`);
      }
    }

    // Create manga with genres and tags in a transaction
    const manga = await prisma.$transaction(async (tx) => {
      // Process tags - convert to slugs
      const tags = Array.isArray(body.tags) ? body.tags : [];
      const tagSlugs = tags.map((tagName: string) => {
        // Generate slug from tag name (support Thai and other unicode characters)
        const tagSlug = tagName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        // If slug is still empty, use encodeURIComponent as fallback
        return tagSlug || encodeURIComponent(tagName.trim()).toLowerCase();
      }).filter((slug) => slug.length > 0);

      const newManga = await tx.manga.create({
        data: {
          slug: body.slug,
          title: body.title,
          originalTitle: body.originalTitle || null,
          description: body.description || null,
          synopsis: body.synopsis || null,
          coverUrl: body.coverUrl || null,
          bannerUrl: body.bannerUrl || null,
          status: body.status,
          visibility: body.visibility,
          isMature: body.isMature,
          contentType: body.contentType,
          genreSlugs: genreSlugs,
          tagSlugs: tagSlugs,
          creatorId: actor.id,
        } as any,
      } as any);

      return newManga;
    });

    return ok({ manga }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
