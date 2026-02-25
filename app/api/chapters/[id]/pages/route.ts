export const dynamic = "force-dynamic";
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

const createPageSchema = z.object({
  pageNo: z.number().int().positive(),
  imageUrl: z.string().refine(
    (val) => val.startsWith("data:") || val.startsWith("http://") || val.startsWith("https://"),
    { message: "imageUrl must be a valid URL or data URL" }
  ),
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

    const pages = await prisma.page.findMany({
      where: { chapterId },
      orderBy: { pageNo: "asc" },
    });

    return ok({ pages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);
    await ensureCanManageChapter(actor, chapterId);
    const body = createPageSchema.parse(await request.json());

    const page = await prisma.page.create({
      data: {
        chapterId,
        pageNo: body.pageNo,
        imageUrl: body.imageUrl,
      },
    });

    return ok({ page }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}


