export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { MangaStatus, Visibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageManga,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";
import { getGenreBySlug } from "@/lib/config/genres";

type Params = {
  params: {
    id: string;
  };
};

const updateMangaSchema = z.object({
  slug: z.string().trim().min(2).max(120).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  originalTitle: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  status: z.nativeEnum(MangaStatus).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  isMature: z.boolean().optional(),
  genreSlugs: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1).max(20)).optional().default([]),
});

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const mangaId = parseId(params.id);
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        chapters: {
          select: {
            id: true,
            number: true,
            title: true,
            slug: true,
            isLocked: true,
            priceCoins: true,
          },
          orderBy: { number: "asc" },
        },
      },
    });

    if (!manga) {
      throw new HttpError(404, "Manga not found");
    }

    return ok({ manga });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseId(params.id);
    await ensureCanManageManga(actor, mangaId);

    const body = updateMangaSchema.parse(await request.json());
    const { genreSlugs, tags, ...mangaData } = body;

    // Validate genre slugs if provided
    if (genreSlugs !== undefined) {
      const slugs = Array.isArray(genreSlugs) ? genreSlugs : [];
      for (const slug of slugs) {
        if (!getGenreBySlug(slug)) {
          throw new HttpError(400, `Invalid genre slug: ${slug}`);
        }
      }
      (mangaData as any).genreSlugs = slugs;
    }

    // Update manga with genres and tags in a transaction
    const manga = await prisma.$transaction(async (tx) => {
      // Update manga basic info
      const updatedManga = await tx.manga.update({
        where: { id: mangaId },
        data: mangaData,
      });

      // Update tags if provided
      if (tags !== undefined) {
        // Delete existing tag relations
        await (tx as any).mangaTag.deleteMany({
          where: { mangaId },
        });

        // Create or get tags and create relations
        if (Array.isArray(tags) && tags.length > 0) {
          try {
            const tagPromises = tags.map(async (tagName: string) => {
              const tagSlug = tagName
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

              if (!tagSlug) {
                return null;
              }

              const tag = await (tx as any).tag.upsert({
                where: { slug: tagSlug },
                update: {},
                create: {
                  name: tagName,
                  slug: tagSlug,
                },
              });

              return tag.id;
            });

            const tagIds = (await Promise.all(tagPromises)).filter(
              (id) => id !== null,
            );

            if (tagIds.length > 0) {
              await (tx as any).mangaTag.createMany({
                data: tagIds.map((tagId) => ({
                  mangaId,
                  tagId,
                })),
                skipDuplicates: true,
              });
            }
          } catch (tagError) {
            console.error("Error updating tags for manga:", tagError);
            // Continue without tags if tag update fails
          }
        }
      }

      return updatedManga;
    });

    return ok({ manga });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseId(params.id);
    await ensureCanManageManga(actor, mangaId);

    await prisma.manga.delete({ where: { id: mangaId } });
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
