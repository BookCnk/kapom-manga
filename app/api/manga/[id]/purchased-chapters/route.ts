export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { getUserBySessionToken } from "@/lib/api/auth";
import {
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const mangaId = parseInt(id);

    if (isNaN(mangaId)) {
      return ok({ purchasedChapterIds: [] });
    }

    // Get session token
    const sessionToken = request.headers.get("x-session-token");
    if (!sessionToken) {
      return ok({ purchasedChapterIds: [] });
    }

    // Get user from session
    const user = await getUserBySessionToken(sessionToken);
    if (!user) {
      return ok({ purchasedChapterIds: [] });
    }

    // Get all successful purchase transactions for this manga
    const purchases = await prisma.coinTransaction.findMany({
      where: {
        userId: user.id,
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
      select: {
        metadata: true,
      },
    });

    // Extract chapter IDs from purchases
    const purchasedChapterIds = new Set<number>();
    purchases.forEach((purchase) => {
      if (purchase.metadata && typeof purchase.metadata === "object") {
        const metadata = purchase.metadata as Record<string, unknown>;
        const chapterId = metadata.chapterId;
        const purchaseMangaId = metadata.mangaId;
        
        if (
          typeof chapterId === "number" &&
          typeof purchaseMangaId === "number" &&
          purchaseMangaId === mangaId
        ) {
          purchasedChapterIds.add(chapterId);
        }
      }
    });

    return ok({
      purchasedChapterIds: Array.from(purchasedChapterIds),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
