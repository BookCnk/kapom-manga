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

    const [history, total] = await Promise.all([
      prisma.readingHistory.findMany({
        where: {
          userId: user.id,
        },
        include: {
          manga: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
              status: true,
            },
          },
          chapter: {
            select: {
              id: true,
              slug: true,
              title: true,
              number: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.readingHistory.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return ok({
      history,
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
