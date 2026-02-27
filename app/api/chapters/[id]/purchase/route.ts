export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/auth";
import { handleRouteError, ok, HttpError } from "@/lib/api/http";
import {
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";
import { z } from "zod";

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    const chapterId = parseInt(id);
    if (isNaN(chapterId)) {
      throw new HttpError(400, "Invalid chapter ID");
    }

    // Get chapter with manga info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: {
            id: true,
            creatorId: true,
            title: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    // Check if chapter is locked
    if (!chapter.isLocked) {
      throw new HttpError(400, "Chapter is not locked");
    }

    // Check if user is the creator (creators can read their own chapters for free)
    if (chapter.manga.creatorId === user.id) {
      throw new HttpError(400, "You cannot purchase your own chapter");
    }

    // Check if user already purchased this chapter
    const existingPurchase = await prisma.coinTransaction.findFirst({
      where: {
        userId: user.id,
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
        metadata: {
          path: ["chapterId"],
          equals: chapterId,
        },
      },
    });

    if (existingPurchase) {
      throw new HttpError(400, "You have already purchased this chapter");
    }

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

    // Calculate price (convert float to int for coins)
    const priceCoins = Math.ceil(chapter.priceCoins);

    // Check if user has enough balance
    if (wallet.balance < priceCoins) {
      throw new HttpError(400, "Insufficient balance");
    }

    // Create transaction
    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance - priceCoins;

    const transaction = await prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
        amount: priceCoins,
        balanceBefore,
        balanceAfter,
        note: `Purchase chapter ${chapter.number} of ${chapter.manga.title}`,
        metadata: {
          chapterId: chapter.id,
          mangaId: chapter.manga.id,
        },
      },
    });

    // Update wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        totalSpent: wallet.totalSpent + priceCoins,
      },
    });

    return ok({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
