import { NextRequest } from "next/server";
import { z } from "zod";
import { MangaStatus, Visibility } from "@/generated/prisma/enums";
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

const updateMangaSchema = z.object({
  slug: z.string().trim().min(2).max(120).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  status: z.nativeEnum(MangaStatus).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  isMature: z.boolean().optional(),
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

    const manga = await prisma.manga.update({
      where: { id: mangaId },
      data: body,
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

