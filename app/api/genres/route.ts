import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
    });

    return ok({ genres });
  } catch (error) {
    return handleRouteError(error);
  }
}
