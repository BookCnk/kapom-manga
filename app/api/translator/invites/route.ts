import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";

const createInviteSchema = z.object({
  inviteeEmail: z.string().email(),
  message: z.string().trim().min(1).max(500).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const inviter = await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);
    const body = createInviteSchema.parse(await request.json());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expiresInDays ?? 7));

    const code = randomUUID().replace(/-/g, "");

    const invite = await prisma.translatorInvite.create({
      data: {
        code,
        inviterId: inviter.id,
        inviteeEmail: body.inviteeEmail.toLowerCase(),
        message: body.message,
        expiresAt,
      },
    });

    return ok(
      {
        invite: {
          id: invite.id,
          code: invite.code,
          status: invite.status,
          inviteeEmail: invite.inviteeEmail,
          expiresAt: invite.expiresAt,
        },
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

