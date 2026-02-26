export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
