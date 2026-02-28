import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserBySessionToken } from "@/lib/api/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mangaId = parseInt(params.id);
    if (isNaN(mangaId)) {
      return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    }

    // Get user from session token
    const token = request.headers.get("x-session-token");
    if (!token) {
      return NextResponse.json({ liked: false, likesCount: 0 });
    }

    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ liked: false, likesCount: 0 });
    }

    // Check if user already liked this manga
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_mangaId: {
          userId: user.id,
          mangaId: mangaId,
        },
      },
    });

    // Get total likes count
    const likesCount = await prisma.like.count({
      where: { mangaId },
    });

    return NextResponse.json({
      liked: !!existingLike,
      likesCount,
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mangaId = parseInt(params.id);
    if (isNaN(mangaId)) {
      return NextResponse.json({ error: "Invalid manga ID" }, { status: 400 });
    }

    // Get user from session token
    const token = request.headers.get("x-session-token");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check if user already liked this manga
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_mangaId: {
          userId: user.id,
          mangaId: mangaId,
        },
      },
    });

    let liked: boolean;
    let likesCount: number;

    if (existingLike) {
      // Remove like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      // Add like
      await prisma.like.create({
        data: {
          userId: user.id,
          mangaId: mangaId,
        },
      });
      liked = true;
    }

    // Get updated likes count
    likesCount = await prisma.like.count({
      where: { mangaId },
    });

    return NextResponse.json({
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
