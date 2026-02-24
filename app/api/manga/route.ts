import { NextRequest } from "next/server";
import { z } from "zod";
import { MangaStatus, UserRole, Visibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureTranslatorOrAdmin } from "@/lib/api/permissions";

const createMangaSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  coverUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  status: z.nativeEnum(MangaStatus).default(MangaStatus.ONGOING),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
  isMature: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const visibility = searchParams.get("visibility") as Visibility | null;
    const status = searchParams.get("status") as MangaStatus | null;
    const creatorIdRaw = searchParams.get("creatorId");
    const creatorId = creatorIdRaw ? Number.parseInt(creatorIdRaw, 10) : undefined;

    const mangas = await prisma.manga.findMany({
      where: {
        visibility: visibility && visibility in Visibility ? visibility : undefined,
        status: status && status in MangaStatus ? status : undefined,
        creatorId:
          creatorId && Number.isInteger(creatorId) && creatorId > 0
            ? creatorId
            : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return ok({ mangas });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin({ id: actor.id, role: actor.role as UserRole });

    const body = createMangaSchema.parse(await request.json());

    const manga = await prisma.manga.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description,
        coverUrl: body.coverUrl,
        bannerUrl: body.bannerUrl,
        status: body.status,
        visibility: body.visibility,
        isMature: body.isMature,
        creatorId: actor.id,
      },
    });

    return ok({ manga }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

