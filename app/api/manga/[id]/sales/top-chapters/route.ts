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
      orderBy: { number: "asc" },
    });
    const chapterIds = chapters.map((ch) => ch.id);

    if (chapterIds.length === 0) {
      return ok({ topChapters: [] });
    }

    // Get all successful purchase transactions for this manga's chapters
    const allPurchases = await prisma.coinTransaction.findMany({
      where: {
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
      select: {
        amount: true,
        metadata: true,
      },
    });

    // Filter purchases that are for this manga's chapters
    const relevantPurchases = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    // Calculate sales per chapter
    const chapterSales: Record<number, number> = {};
    relevantPurchases.forEach((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      if (typeof chapterId === "number") {
        chapterSales[chapterId] = (chapterSales[chapterId] || 0) + tx.amount;
      }
    });

    // Create array of chapters with sales
    const chaptersWithSales = chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title || `ตอนที่ ${chapter.number}`,
      sales: chapterSales[chapter.id] || 0,
    }));

    // Sort by sales descending and take top 10
    const topChapters = chaptersWithSales
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map((chapter, index) => ({
        rank: index + 1,
        chapterNumber: chapter.number,
        title: chapter.title,
        sales: chapter.sales,
      }));

    return ok({ topChapters });
  } catch (error) {
    return handleRouteError(error);
  }
}
