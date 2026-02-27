export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      throw new HttpError(400, "Invalid notification ID");
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    if (notification.userId !== user.id) {
      throw new HttpError(403, "You can only delete your own notifications");
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
