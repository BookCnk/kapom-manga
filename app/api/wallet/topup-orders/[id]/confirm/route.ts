export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  CoinTransactionStatus,
  CoinTransactionType,
  TopupOrderStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/auth";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

type Params = {
  params: {
    id: string;
  };
};

const confirmSchema = z.object({
  providerRef: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole(request, [UserRole.ADMIN]);

    const orderId = Number.parseInt(params.id, 10);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new HttpError(400, "Invalid order id");
    }

    const body = confirmSchema.parse(await request.json());
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.topupOrder.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new HttpError(404, "Topup order not found");
      }

      if (order.status === TopupOrderStatus.PAID) {
        return { status: "already_paid" as const, order };
      }

      if (order.status !== TopupOrderStatus.PENDING) {
        throw new HttpError(
          409,
          `Only pending orders can be confirmed (current: ${order.status})`,
        );
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId },
        update: {},
      });

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + order.coins;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalTopup: wallet.totalTopup + order.coins,
        },
      });

      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId: order.userId,
          type: CoinTransactionType.TOPUP,
          status: CoinTransactionStatus.SUCCESS,
          amount: order.coins,
          balanceBefore,
          balanceAfter,
          provider: order.provider,
          providerRef: body.providerRef,
          note: body.note ?? "Topup order confirmed",
          metadata: { topupOrderId: order.id, amountMinor: order.amountMinor },
        },
      });

      const updatedOrder = await tx.topupOrder.update({
        where: { id: order.id },
        data: {
          status: TopupOrderStatus.PAID,
          providerRef: body.providerRef,
          paidAt: now,
        },
      });

      return { status: "paid" as const, order: updatedOrder };
    });

    return ok({
      result: result.status,
      order: {
        id: result.order.id,
        status: result.order.status,
        userId: result.order.userId,
        coins: result.order.coins,
        providerRef: result.order.providerRef,
        paidAt: result.order.paidAt,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
