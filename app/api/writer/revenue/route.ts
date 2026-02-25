export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";
import {
  UserRole,
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Require translator or admin role
    const user = await requireRole(request, [
      UserRole.TRANSLATOR,
      UserRole.ADMIN,
    ]);

    const { searchParams } = new URL(request.url);
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    );
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );

    // Get start and end date for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all chapters from this user's mangas
    const userChapters = await prisma.chapter.findMany({
      where: {
        manga: {
          creatorId: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    const chapterIds = userChapters.map((ch) => ch.id);

    // Get all successful purchase transactions
    // Note: We need to check metadata for chapterId since it's not a direct relation
    const allPurchases = await prisma.coinTransaction.findMany({
      where: {
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Filter purchases that are for this user's chapters
    // Assuming metadata contains { chapterId: number }
    const relevantPurchases = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    // Initialize daily sales
    const daysInMonth = new Date(year, month, 0).getDate();
    const salesByDay: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      salesByDay[day] = 0;
    }

    // If no chapters, return empty data
    if (chapterIds.length === 0) {
      return ok({
        dailySales: salesByDay,
        totalSalesThisMonth: 0,
        totalSalesAllTime: 0,
      });
    }

    // Group purchases by day
    relevantPurchases.forEach((purchase) => {
      const day = purchase.createdAt.getDate();
      salesByDay[day] = (salesByDay[day] || 0) + purchase.amount;
    });

    // Get total sales for this month
    const totalSalesThisMonth = Object.values(salesByDay).reduce(
      (sum, val) => sum + val,
      0,
    );

    // Get total sales for all time
    const allTimePurchases = await prisma.coinTransaction.findMany({
      where: {
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
      select: {
        amount: true,
        metadata: true,
      },
    });

    const allTimeRelevantPurchases = allTimePurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    const totalSalesAllTime = allTimeRelevantPurchases.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );

    return ok({
      dailySales: salesByDay,
      totalSalesThisMonth,
      totalSalesAllTime,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
