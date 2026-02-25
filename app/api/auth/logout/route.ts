export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { getUserBySessionToken } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    if (!sessionToken) {
      return ok({ success: true });
    }

    // Delete the session from database
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

