export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/auth";
import { handleRouteError, ok } from "@/lib/api/http";

const createTopupOrderSchema = z.object({
  coins: z.number().int().positive(),
  amountMinor: z.number().int().positive(),
  currency: z.string().trim().min(3).max(3).default("THB"),
  provider: z.string().trim().min(2).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = createTopupOrderSchema.parse(await request.json());

    const order = await prisma.topupOrder.create({
      data: {
        userId: user.id,
        coins: body.coins,
        amountMinor: body.amountMinor,
        currency: body.currency.toUpperCase(),
        provider: body.provider,
      },
    });

    return ok(
      {
        order: {
          id: order.id,
          status: order.status,
          coins: order.coins,
          amountMinor: order.amountMinor,
          currency: order.currency,
          provider: order.provider,
        },
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}


