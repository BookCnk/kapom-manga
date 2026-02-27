export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

type Params = {
  params: {
    id: string;
  };
};

function parseMangaId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const mangaId = parseMangaId(params.id);
    console.log(`[API] Fetching comments for manga ${mangaId}`);
    
    // Try to get current user from session
    let currentUserId: number | null = null;
    try {
      const sessionToken = request.headers.get("x-session-token");
      if (sessionToken) {
        const { getUserBySessionToken } = await import("@/lib/api/auth");
        const user = await getUserBySessionToken(sessionToken);
        if (user) {
          currentUserId = user.id;
          console.log(`[API] Current user: ${currentUserId}`);
        }
      }
    } catch (error) {
      // Ignore auth errors, just continue without user
      console.log(`[API] Auth error (ignored):`, error);
    }

    // Fetch top-level comments (reviews) for this manga
    // Reviews = comments with mangaId, no chapterId, and no parentId
    let comments;
    try {
      console.log(`[API] Querying comments with mangaId=${mangaId}, chapterId=null, parentId=null`);
      comments = await prisma.comment.findMany({
        where: {
          mangaId,
          chapterId: null, // Only reviews (not chapter comments)
          parentId: null, // Only top-level comments (not replies)
        },
        select: {
          id: true,
          userId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log(`[API] Found ${comments.length} comments`);
    } catch (dbError) {
      console.error("[API] Database error fetching comments:", dbError);
      if (dbError instanceof Error) {
        console.error("[API] Error name:", dbError.name);
        console.error("[API] Error message:", dbError.message);
        console.error("[API] Error stack:", dbError.stack);
      }
      throw dbError;
    }

    // Get user's liked comments if logged in
    let userLikedCommentIds: Set<number> = new Set();
    if (currentUserId && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const userLikes = await prisma.commentLike.findMany({
        where: {
          userId: currentUserId,
          commentId: {
            in: commentIds,
          },
        },
        select: {
          commentId: true,
        },
      });
      userLikedCommentIds = new Set(userLikes.map((l) => l.commentId));
    }

    // Add isLiked flag to each comment
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      isLiked: userLikedCommentIds.has(comment.id),
    }));

    return ok({ comments: commentsWithLikes });
  } catch (error) {
    console.error("[API] Error fetching comments:", error);
    if (error instanceof Error) {
      console.error("[API] Error message:", error.message);
      console.error("[API] Error stack:", error.stack);
    }
    return handleRouteError(error);
  }
}
