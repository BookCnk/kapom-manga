export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50"); // Default to 50

    // Get latest 50 reading history items (no pagination needed)
    const history = await prisma.readingHistory.findMany({
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
    });

    return ok({
      history,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
