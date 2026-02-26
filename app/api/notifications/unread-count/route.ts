export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return ok({ count });
  } catch (error) {
    return handleRouteError(error);
  }
}
