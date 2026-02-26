export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { checkInappropriateContent } from "@/lib/utils/content-filter";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "node:crypto";

const registerSchema = z.object({
  email: z.string().trim().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(128),
  name: z.string().trim().max(100).optional().transform(val => val && val.length > 0 ? val : undefined),
});

function generateUsername(): string {
  // First digit is always 1, remaining 20 digits are random
  const bytes = randomBytes(20);
  let digits = "1";
  for (const b of bytes) {
    digits += (b % 10).toString();
  }
  return digits.slice(0, 21);
}

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    if (body.name) {
      const nameCheck = checkInappropriateContent(body.name);
      if (nameCheck.isInappropriate) {
        throw new HttpError(400, "ชื่อที่แสดงมีคำต้องห้ามหรือ 18+");
      }
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new HttpError(409, "อีเมลนี้ถูกใช้สมัครแล้ว");
    }

    // Generate unique username (21-digit number starting with 1)
    let username = generateUsername();
    let usernameExists = await prisma.user.findUnique({ where: { username } });
    let attempts = 0;
    while (usernameExists && attempts < 20) {
      username = generateUsername();
      usernameExists = await prisma.user.findUnique({ where: { username } });
      attempts++;
    }
    if (usernameExists) {
      throw new HttpError(500, "ไม่สามารถสร้างชื่อผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: body.name || null,
        passwordHash: hashPassword(body.password),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return ok({ user }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
