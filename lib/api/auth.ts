import { type NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api/http";

type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

export async function getUserBySessionToken(
  token: string,
): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;

  return session.user;
}

async function getUserByHeaderId(userIdRaw: string): Promise<AuthUser | null> {
  const userId = Number.parseInt(userIdRaw, 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  return user;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const sessionToken = request.headers.get("x-session-token");
  if (sessionToken) {
    const sessionUser = await getUserBySessionToken(sessionToken);
    if (sessionUser) return sessionUser;
  }

  const userIdHeader = request.headers.get("x-user-id");
  if (userIdHeader) {
    const user = await getUserByHeaderId(userIdHeader);
    if (user) return user;
  }

  throw new HttpError(
    401,
    "Unauthorized. Send x-session-token or x-user-id header.",
  );
}

export async function requireRole(
  request: NextRequest,
  roles: UserRole[],
): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}
