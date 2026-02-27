export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok, HttpError } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { z } from "zod";

const updateReadingHistorySchema = z.object({
  chapterId: z.number().int().positive(),
  lastPage: z.number().int().positive().default(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { chapterId, lastPage } = updateReadingHistorySchema.parse(body);

    // Get chapter to find mangaId
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { mangaId: true },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    // Upsert reading history (update if exists, create if not)
    // Using unique constraint on userId + mangaId
    const readingHistory = await prisma.readingHistory.upsert({
      where: {
        userId_mangaId: {
          userId: user.id,
          mangaId: chapter.mangaId,
        },
      },
      update: {
        chapterId,
        lastPage,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        mangaId: chapter.mangaId,
        chapterId,
        lastPage,
      },
    });

    return ok({ readingHistory });
  } catch (error) {
    return handleRouteError(error);
  }
}
