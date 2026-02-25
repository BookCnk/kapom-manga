export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { getUserBySessionToken } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    if (!sessionToken) {
      return ok({ user: null });
    }

    const user = await getUserBySessionToken(sessionToken);
    if (!user) {
      return ok({ user: null });
    }

    // Refresh session expiration if it's still valid (extend by 30 days)
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (session && session.expiresAt > new Date()) {
      // Extend session by 30 days from now
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      
      await prisma.session.update({
        where: { token: sessionToken },
        data: { expiresAt: newExpiresAt },
      });
    }

    // Get full user info
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return ok({ user: fullUser });
  } catch (error) {
    return handleRouteError(error);
  }
}

