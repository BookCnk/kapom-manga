export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Delete all notifications for this user
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
