export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";
import { UserRole, CoinTransactionType, CoinTransactionStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  try {
    // Require translator or admin role
    const user = await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);

    // Get manga statistics for this user
    const mangaStats = await prisma.manga.aggregate({
      where: { creatorId: user.id },
      _count: { id: true },
      _sum: {
        views: true,
        likesCount: true,
      },
    });

    // Get chapter count
    const chapterCount = await prisma.chapter.count({
      where: {
        manga: {
          creatorId: user.id,
        },
      },
    });

    // Get bookmarks count
    const bookmarksCount = await prisma.bookmark.count({
      where: {
        manga: {
          creatorId: user.id,
        },
      },
    });

    // Get comments count
    const commentsCount = await prisma.comment.count({
      where: {
        manga: {
          creatorId: user.id,
        },
      },
    });

    // Get total sales from actual purchases (CoinTransaction)
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

    // Get all successful purchase transactions for this user's chapters
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

    // Filter purchases that are for this user's chapters
    const relevantPurchases = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    const totalSales = relevantPurchases.reduce((sum, tx) => sum + tx.amount, 0);

    // Novel stats (placeholder - 0 for now)
    const novelStats = {
      stories: 0,
      episodes: 0,
      views: 0,
      likes: 0,
      bookmarks: 0,
      comments: 0,
      totalSales: 0,
    };

    return ok({
      manga: {
        stories: mangaStats._count.id || 0,
        episodes: chapterCount,
        views: mangaStats._sum.views || 0,
        likes: mangaStats._sum.likesCount || 0,
        bookmarks: bookmarksCount,
        comments: commentsCount,
        totalSales: totalSales,
      },
      novel: novelStats,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

