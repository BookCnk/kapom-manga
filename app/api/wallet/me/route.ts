import { NextRequest } from "next/server";
import { CoinTransactionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/auth";
import { handleRouteError, ok } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const [wallet, recentTransactions] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: user.id },
      }),
      prisma.coinTransaction.findMany({
        where: { userId: user.id, status: CoinTransactionStatus.SUCCESS },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          note: true,
          createdAt: true,
        },
      }),
    ]);

    return ok({
      wallet: {
        balance: wallet?.balance ?? 0,
        totalTopup: wallet?.totalTopup ?? 0,
        totalSpent: wallet?.totalSpent ?? 0,
      },
      transactions: recentTransactions,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

