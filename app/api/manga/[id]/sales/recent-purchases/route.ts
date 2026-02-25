import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureCanManageManga } from "@/lib/api/permissions";
import { CoinTransactionType, CoinTransactionStatus } from "@/generated/prisma/enums";

type Params = {
  params: {
    id: string;
  };
};

function parseMangaId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    const mangaId = parseMangaId(params.id);
    await ensureCanManageManga(actor, mangaId);

    // Get all chapters for this manga
    const chapters = await prisma.chapter.findMany({
      where: { mangaId },
      select: { id: true, number: true, title: true },
    });
    const chapterIds = chapters.map((ch) => ch.id);

    if (chapterIds.length === 0) {
      return ok({ recentPurchases: [] });
    }

    // Get all successful purchase transactions for this manga's chapters
    const allPurchases = await prisma.coinTransaction.findMany({
      where: {
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
      select: {
        amount: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Filter purchases that are for this manga's chapters
    const relevantPurchases = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    // Map to chapter info
    const recentPurchases = relevantPurchases.map((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return null;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      if (typeof chapterId !== "number") return null;

      const chapter = chapters.find((ch) => ch.id === chapterId);
      if (!chapter) return null;

      return {
        purchaseDate: tx.createdAt,
        chapterNumber: chapter.number,
        title: chapter.title || `ตอนที่ ${chapter.number}`,
        price: tx.amount,
      };
    }).filter((p) => p !== null);

    return ok({ recentPurchases });
  } catch (error) {
    return handleRouteError(error);
  }
}
