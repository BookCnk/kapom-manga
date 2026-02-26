export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { verifyPassword } from "@/lib/auth/password";
import { checkInappropriateContent } from "@/lib/utils/content-filter";

const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z]+$/, "Username must contain English letters (A-Z, a-z) only"),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(request);
    const body = changeUsernameSchema.parse(await request.json());

    const usernameCheck = checkInappropriateContent(body.newUsername);
    if (usernameCheck.isInappropriate) {
      throw new HttpError(400, "Username นี้มีคำต้องห้ามหรือคำ 18+");
    }

    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      throw new HttpError(400, "ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้");
    }

    const isValid = verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "รหัสผ่านไม่ถูกต้อง");
    }

    const normalizedUsername = body.newUsername.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (existing && existing.id !== actor.id) {
      throw new HttpError(409, "Username นี้ถูกใช้แล้ว");
    }

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: { username: normalizedUsername },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatarUrl: true,
        bannerUrl: true,
        createdAt: true,
      },
    });

    return ok({ user: updated, message: "เปลี่ยนชื่อผู้ใช้สำเร็จ" });
  } catch (error) {
    return handleRouteError(error);
  }
}

