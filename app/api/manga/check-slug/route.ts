export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleRouteError } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug || typeof slug !== "string") {
      return ok({ exists: false });
    }

    const existing = await prisma.manga.findUnique({
      where: { slug },
      select: { id: true },
    });

    return ok({ exists: !!existing });
  } catch (error) {
    return handleRouteError(error);
  }
}

