export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    const commentId = parseInt(params.id);
    const body = updateCommentSchema.parse(await request.json());

    if (isNaN(commentId)) {
      throw new HttpError(400, "Invalid comment ID");
    }

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        manga: {
          select: {
            id: true,
            creatorId: true,
            bookmarks: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!existingComment) {
      throw new HttpError(404, "Comment not found");
    }

    if (existingComment.userId !== user.id) {
      throw new HttpError(403, "You can only edit your own comments");
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: body.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        manga: {
          select: {
            id: true,
            slug: true,
            title: true,
            creatorId: true,
          },
        },
      },
    });

    // Note: We don't create new notifications when editing a comment
    // Only create notifications when a new comment is created

    return ok({ comment: updatedComment });
  } catch (error) {
    return handleRouteError(error);
  }
}
