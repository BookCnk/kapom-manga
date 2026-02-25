import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";
import { UserRole, CoinTransactionType, CoinTransactionStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  try {
    // Require translator or admin role
    const user = await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          totalTopup: 0,
          totalSpent: 0,
        },
      });
    }

    // Get all chapters from this user's mangas
    const userChapters = await prisma.chapter.findMany({
      where: {
        manga: {
          creatorId: user.id,
        },
      },
      select: {
        id: true,
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    const chapterIds = userChapters.map((ch) => ch.id);

    // Get all successful purchase transactions (Sales)
    const allPurchases = await prisma.coinTransaction.findMany({
      where: {
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter purchases that are for this user's chapters
    const salesTransactions = allPurchases.filter((tx) => {
      if (!tx.metadata || typeof tx.metadata !== "object") return false;
      const metadata = tx.metadata as Record<string, unknown>;
      const chapterId = metadata.chapterId;
      return typeof chapterId === "number" && chapterIds.includes(chapterId);
    });

    // Calculate total sales
    const totalSales = salesTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get support transactions (assuming they're in metadata or a different type)
    // For now, we'll use a placeholder - you may need to adjust based on your business logic
    const supportTransactions: typeof salesTransactions = [];
    const totalSupport = 0;

    // Get withdrawal history (assuming withdrawals are tracked differently)
    // For now, we'll return empty array - you may need to create a Withdrawal model
    const withdrawals: any[] = [];

    // Get ReadCoin transfer history (if applicable)
    const readCoinTransfers: any[] = [];

    // Calculate next settlement date (25th of next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 25);
    const nextSettlementDate = nextMonth.toISOString().split("T")[0];

    return ok({
      wallet: {
        balance: wallet.balance,
        totalSales: totalSales,
        totalSupport,
        totalBalance: wallet.balance,
      },
      status: {
        transferWithdrawalStatus: "ปกติ", // Normal
        nextSettlementDate,
      },
      salesTransactions: salesTransactions.map((tx) => {
        const metadata = tx.metadata as Record<string, unknown>;
        const chapterId = metadata.chapterId as number;
        const chapter = userChapters.find((ch) => ch.id === chapterId);
        return {
          id: tx.id,
          date: tx.createdAt.toISOString(),
          type: "การ์ตูน", // Manga
          salesItem: chapter
            ? `${chapter.manga.title} - ${chapter.manga.title}`
            : "ไม่ระบุ",
          amount: tx.amount,
        };
      }),
      supportTransactions: supportTransactions.map((tx) => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        readerProfile: "@unknown", // You may need to get this from metadata
        amount: tx.amount,
      })),
      readCoinTransfers,
      withdrawals,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
