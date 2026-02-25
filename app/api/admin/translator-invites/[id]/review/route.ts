export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { TranslatorInviteStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";

type Params = {
  params: {
    id: string;
  };
};

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireRole(request, [UserRole.ADMIN]);
    const inviteId = Number.parseInt(params.id, 10);
    if (!Number.isInteger(inviteId) || inviteId <= 0) {
      throw new HttpError(400, "Invalid invite id");
    }

    const body = reviewSchema.parse(await request.json());

    const invite = await prisma.translatorInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      throw new HttpError(404, "Invite not found");
    }

    if (invite.status !== TranslatorInviteStatus.ACCEPTED) {
      throw new HttpError(
        409,
        `Only accepted invites can be reviewed (current: ${invite.status})`,
      );
    }

    const now = new Date();
    const nextStatus =
      body.action === "approve"
        ? TranslatorInviteStatus.APPROVED
        : TranslatorInviteStatus.REJECTED;

    const result = await prisma.$transaction(async (tx) => {
      const updatedInvite = await tx.translatorInvite.update({
        where: { id: inviteId },
        data: {
          status: nextStatus,
          adminReviewerId: admin.id,
          adminReviewedAt: now,
          adminReviewNote: body.note,
          approvedAt: body.action === "approve" ? now : null,
          rejectedAt: body.action === "reject" ? now : null,
        },
      });

      if (body.action === "approve" && updatedInvite.inviteeUserId) {
        await tx.user.update({
          where: { id: updatedInvite.inviteeUserId },
          data: { role: UserRole.TRANSLATOR },
        });
      }

      return updatedInvite;
    });

    return ok({
      invite: {
        id: result.id,
        status: result.status,
        adminReviewerId: result.adminReviewerId,
        adminReviewedAt: result.adminReviewedAt,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}


