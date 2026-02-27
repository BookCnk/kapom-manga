export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    const commentId = parseInt(params.id);

    if (isNaN(commentId)) {
      throw new HttpError(400, "Invalid comment ID");
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId: commentId,
        },
      },
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId: commentId,
          },
        },
      });

      // Get updated like count
      const likeCount = await prisma.commentLike.count({
        where: { commentId },
      });

      return ok({ liked: false, likeCount });
    } else {
      // Like: create the like
      await prisma.commentLike.create({
        data: {
          userId: user.id,
          commentId: commentId,
        },
      });

      // Get updated like count
      const likeCount = await prisma.commentLike.count({
        where: { commentId },
      });

      return ok({ liked: true, likeCount });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
