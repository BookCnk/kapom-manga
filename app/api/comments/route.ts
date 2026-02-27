export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";

const createCommentSchema = z.object({
  mangaId: z.number().optional(),
  chapterId: z.number().optional(),
  content: z.string().trim().min(1).max(500),
  parentId: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = createCommentSchema.parse(await request.json());

    if (!body.mangaId && !body.chapterId) {
      throw new HttpError(400, "Either mangaId or chapterId is required");
    }

    // For manga reviews (top-level comments without chapterId), check if user already has a review
    if (body.mangaId && !body.chapterId && !body.parentId) {
      const existingReview = await prisma.comment.findFirst({
        where: {
          userId: user.id,
          mangaId: body.mangaId,
          chapterId: null, // Only reviews (not chapter comments)
          parentId: null, // Only top-level (not replies)
        },
      });

      if (existingReview) {
        throw new HttpError(400, "คุณเคยรีวิวเรื่องนี้แล้ว กรุณาแก้ไขรีวิวเดิมแทน");
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        mangaId: body.mangaId ?? undefined,
        chapterId: body.chapterId ?? undefined,
        content: body.content,
        parentId: body.parentId ?? undefined,
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

    // Create notifications for:
    // 1. Users who bookmarked this manga
    // 2. The creator of this manga (if different from commenter)
    if (body.mangaId) {
      const manga = await prisma.manga.findUnique({
        where: { id: body.mangaId },
        select: {
          id: true,
          creatorId: true,
          bookmarks: {
            select: { userId: true },
          },
        },
      });

      if (manga) {
        const notificationData: Array<{
          userId: number;
          type: "COMMENT_ON_BOOKMARKED_MANGA" | "COMMENT_ON_MY_MANGA";
          commentId: number;
          mangaId: number;
        }> = [];

        // Notify users who bookmarked this manga (excluding the creator)
        for (const bookmark of manga.bookmarks) {
          // Skip if it's the commenter or the creator (creator will get COMMENT_ON_MY_MANGA)
          if (bookmark.userId !== user.id && bookmark.userId !== manga.creatorId) {
            notificationData.push({
              userId: bookmark.userId,
              type: "COMMENT_ON_BOOKMARKED_MANGA",
              commentId: comment.id,
              mangaId: manga.id,
            });
          }
        }

        // Notify the creator (if different from commenter)
        // Always notify the creator when someone comments on their manga
        if (manga.creatorId && manga.creatorId !== user.id) {
          notificationData.push({
            userId: manga.creatorId,
            type: "COMMENT_ON_MY_MANGA",
            commentId: comment.id,
            mangaId: manga.id,
          });
        }

        // Create notifications in batch
        if (notificationData.length > 0) {
          await prisma.notification.createMany({
            data: notificationData,
          });
        }
      }
    }

    return ok({ comment }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
