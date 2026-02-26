export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

type Params = {
  params: {
    username: string;
  };
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { username } = await params;

    if (!username) {
      throw new HttpError(400, "Username is required");
    }

    // Check if username is a number (ID) or a string (username)
    // Usernames are 21 digits starting with 1, so if it's 21 digits, it's definitely a username
    const isNumeric = /^\d+$/.test(username);
    let user;

    if (isNumeric && username.length < 21) {
      // Search by ID (only if it's numeric and less than 21 digits)
      const userId = parseInt(username, 10);
      if (isNaN(userId) || userId <= 0 || userId > Number.MAX_SAFE_INTEGER) {
        throw new HttpError(404, "User not found");
      }

      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          facebookUrl: true,
          tiktokUrl: true,
          role: true,
          avatarUrl: true,
          bannerUrl: true,
          createdAt: true,
        },
      });
    } else {
      // Search by username (case-insensitive)
      // Try exact match first, then try case-insensitive
      const normalizedUsername = username.toLowerCase();
      
      // First try exact match
      user = await prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          facebookUrl: true,
          tiktokUrl: true,
          role: true,
          avatarUrl: true,
          bannerUrl: true,
          createdAt: true,
        },
      });

      // If not found, try case-insensitive search using findMany
      if (!user) {
        const users = await prisma.user.findMany({
          where: {
            username: {
              not: null,
            },
          },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            bio: true,
            role: true,
            avatarUrl: true,
            bannerUrl: true,
            createdAt: true,
          },
        });

        // Filter case-insensitively
        user = users.find(
          (u) => u.username?.toLowerCase() === normalizedUsername
        ) || null;
      }
    }

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Get user statistics
    const [bookmarksCount, likesCount, chaptersReadGroups, mangas] = await Promise.all([
      prisma.bookmark.count({
        where: { userId: user.id },
      }),
      prisma.like.count({
        where: { userId: user.id },
      }),
      prisma.readingHistory.groupBy({
        where: { userId: user.id },
        by: ["chapterId"],
      }),
      // Get mangas created by this user
      prisma.manga.findMany({
        where: { creatorId: user.id },
        select: {
          id: true,
          slug: true,
          title: true,
          originalTitle: true,
          description: true,
          coverUrl: true,
          status: true,
          views: true,
          likesCount: true,
          genreSlugs: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              chapters: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return ok({
      user,
      stats: {
        bookmarks: bookmarksCount,
        likes: likesCount,
        chaptersRead: chaptersReadGroups.length,
      },
      mangas,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
