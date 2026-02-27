export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageManga,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";

type Params = {
  params: {
    id: string;
  };
};

const createChapterSchema = z.object({
  title: z.string().trim().min(1).max(255),
  number: z.number().positive(),
  slug: z.string().trim().min(1).max(120),
  thumbnailUrl: z.string().url().optional(),
  isLocked: z.boolean().default(false),
  priceCoins: z.number().min(0).default(0).transform((v) => Math.round(v * 100) / 100),
  publishedAt: z.string().datetime().optional(),
});

function parseMangaId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const mangaId = parseMangaId(params.id);

    const chapters = await prisma.chapter.findMany({
      where: { mangaId },
      orderBy: { number: "asc" },
    });

    return ok({ chapters });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseMangaId(params.id);
    await ensureCanManageManga(actor, mangaId);
    const body = createChapterSchema.parse(await request.json());

    // Check if slug already exists (slug must be unique globally)
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug: body.slug },
    });

    if (existingChapter) {
      throw new HttpError(400, "Chapter slug already exists");
    }

    const chapter = await prisma.chapter.create({
      data: {
        mangaId,
        title: body.title,
        number: body.number,
        slug: body.slug,
        thumbnailUrl: body.thumbnailUrl,
        isLocked: body.isLocked,
        priceCoins: body.priceCoins,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      },
    });

    return ok({ chapter }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}


