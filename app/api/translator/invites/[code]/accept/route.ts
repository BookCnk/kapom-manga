export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { TranslatorInviteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

type Params = {
  params: {
    code: string;
  };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);

    const code = params.code?.trim();
    if (!code) {
      throw new HttpError(400, "Invite code is required");
    }

    const invite = await prisma.translatorInvite.findUnique({
      where: { code },
    });

    if (!invite) {
      throw new HttpError(404, "Invite not found");
    }

    if (invite.status !== TranslatorInviteStatus.PENDING) {
      throw new HttpError(
        409,
        `Invite is already ${invite.status.toLowerCase()}`,
      );
    }

    if (invite.expiresAt <= new Date()) {
      await prisma.translatorInvite.update({
        where: { id: invite.id },
        data: { status: TranslatorInviteStatus.EXPIRED },
      });
      throw new HttpError(410, "Invite has expired");
    }

    if (invite.inviteeEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new HttpError(
        403,
        "This invite email does not match your account email",
      );
    }

    const accepted = await prisma.translatorInvite.update({
      where: { id: invite.id },
      data: {
        status: TranslatorInviteStatus.ACCEPTED,
        inviteeUserId: user.id,
        acceptedAt: new Date(),
      },
    });

    return ok({
      invite: {
        id: accepted.id,
        code: accepted.code,
        status: accepted.status,
        acceptedAt: accepted.acceptedAt,
      },
      message: "Invite accepted. Waiting for admin review.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
