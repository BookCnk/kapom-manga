export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureCanManagePage, ensureTranslatorOrAdmin } from "@/lib/api/permissions";

type Params = {
  params: {
    id: string;
  };
};

const updatePageSchema = z.object({
  pageNo: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
});

function parsePageId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid page id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const pageId = parsePageId(params.id);
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw new HttpError(404, "Page not found");
    }
    return ok({ page });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const pageId = parsePageId(params.id);
    await ensureCanManagePage(actor, pageId);
    const body = updatePageSchema.parse(await request.json());

    const page = await prisma.page.update({
      where: { id: pageId },
      data: body,
    });

    return ok({ page });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const pageId = parsePageId(params.id);
    await ensureCanManagePage(actor, pageId);

    await prisma.page.delete({ where: { id: pageId } });
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}


