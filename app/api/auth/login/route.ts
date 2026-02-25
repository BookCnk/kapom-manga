import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { verifyPassword } from "@/lib/auth/password";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash || !verifyPassword(body.password, user.passwordHash)) {
      throw new HttpError(401, "Invalid email or password");
    }

    // Check if user has an existing valid session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        expiresAt: "desc", // Get the most recent session
      },
    });

    let token: string;
    let expiresAt: Date;

    if (existingSession) {
      // Use existing session and extend it
      token = existingSession.token;
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Extend for another 30 days
      
      // Update the existing session
      await prisma.session.update({
        where: { id: existingSession.id },
        data: { expiresAt },
      });
    } else {
      // Create new session
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      token = randomBytes(32).toString("hex");

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });
    }

    return ok({
      session: {
        token,
        expiresAt,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

