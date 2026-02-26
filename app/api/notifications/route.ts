export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where = {
      userId: user.id,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          comment: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          manga: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return ok({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
