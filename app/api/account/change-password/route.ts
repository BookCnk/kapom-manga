export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(request);
    const body = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new HttpError(400, "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    }

    const isValid = verifyPassword(body.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "รหัสผ่านเดิมไม่ถูกต้อง");
    }

    const newHash = hashPassword(body.newPassword);

    await prisma.user.update({
      where: { id: actor.id },
      data: { passwordHash: newHash },
    });

    return ok({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    return handleRouteError(error);
  }
}

