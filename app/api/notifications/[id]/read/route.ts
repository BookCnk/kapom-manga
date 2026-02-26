export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      throw new HttpError(400, "Invalid notification ID");
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    if (notification.userId !== user.id) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.notification.update({
      where: { id: notificationId },
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
