import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageChapter,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";

type Params = {
  params: {
    id: string;
  };
};

const updateChapterSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  number: z.number().positive().optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  isLocked: z.boolean().optional(),
  priceCoins: z.number().int().min(0).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

function parseChapterId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid chapter id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const chapterId = parseChapterId(params.id);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        pages: {
          select: { id: true, pageNo: true, imageUrl: true },
          orderBy: { pageNo: "asc" },
        },
      },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    return ok({ chapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);
    await ensureCanManageChapter(actor, chapterId);
    const body = updateChapterSchema.parse(await request.json());

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...body,
        publishedAt:
          body.publishedAt === undefined
            ? undefined
            : body.publishedAt === null
              ? null
              : new Date(body.publishedAt),
      },
    });

    return ok({ chapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);
    await ensureCanManageChapter(actor, chapterId);

    await prisma.chapter.delete({ where: { id: chapterId } });
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

