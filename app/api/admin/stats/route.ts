export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Require admin or translator role
    const user = await requireRole(request, [UserRole.ADMIN, UserRole.TRANSLATOR]);

    // Get statistics in parallel
    const [
      totalMangas,
      totalUsers,
      totalViews,
      totalChapters,
    ] = await Promise.all([
      // Total mangas count
      prisma.manga.count(),
      // Total users count
      prisma.user.count(),
      // Total views (sum of all manga views)
      prisma.manga.aggregate({
        _sum: {
          views: true,
        },
      }),
      // Total chapters count
      prisma.chapter.count(),
    ]);

    // Get user-specific stats if translator
    const myMangasCount = user.role === UserRole.TRANSLATOR
      ? await prisma.manga.count({
          where: { creatorId: user.id },
        })
      : null;

    return ok({
      stats: {
        totalMangas,
        totalUsers,
        totalViews: totalViews._sum.views || 0,
        totalChapters,
        myMangasCount,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

