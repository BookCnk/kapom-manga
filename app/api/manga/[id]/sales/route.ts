export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureCanManageManga } from "@/lib/api/permissions";
import { CoinTransactionType, CoinTransactionStatus } from "@prisma/client";

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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : null;
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : null;

    // Get all chapters for this manga
    const chapters = await prisma.chapter.findMany({
      where: { mangaId },
      select: { id: true },
    });
    const chapterIds = chapters.map((ch) => ch.id);

    if (chapterIds.length === 0) {
      return ok({
        totalSales: 0,
        monthlySales: {},
        yearlySales: {},
        totalSalesThisMonth: 0,
        totalSalesThisYear: 0,
      });
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
    });

    // Filter purchases that are for this manga's chapters
    const relevantPurchases = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    // Calculate total sales
    const totalSales = relevantPurchases.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );

    // Monthly sales (if month and year provided)
    let monthlySales: Record<number, number> = {};
    let totalSalesThisMonth = 0;

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const monthPurchases = relevantPurchases.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= startDate && txDate <= endDate;
      });

      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        monthlySales[day] = 0;
      }

      monthPurchases.forEach((purchase) => {
        const day = new Date(purchase.createdAt).getDate();
        monthlySales[day] = (monthlySales[day] || 0) + purchase.amount;
      });

      totalSalesThisMonth = monthPurchases.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
    }

    // Yearly sales (if year provided)
    let yearlySales: Record<number, number> = {};
    let totalSalesThisYear = 0;

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const yearPurchases = relevantPurchases.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= startDate && txDate <= endDate;
      });

      for (let month = 0; month < 12; month++) {
        yearlySales[month + 1] = 0;
      }

      yearPurchases.forEach((purchase) => {
        const month = new Date(purchase.createdAt).getMonth() + 1;
        yearlySales[month] = (yearlySales[month] || 0) + purchase.amount;
      });

      totalSalesThisYear = yearPurchases.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
    }

    return ok({
      totalSales,
      monthlySales,
      yearlySales,
      totalSalesThisMonth,
      totalSalesThisYear,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
