export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { getUserBySessionToken } from "@/lib/api/auth";
import { ensureCanManageManga } from "@/lib/api/permissions";
import {
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";

type Params = {
  params: {
    slug: string;
  };
};

type ChapterStatus = "published" | "hidden" | "scheduled";

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params;
    if (!slug || typeof slug !== "string") {
      throw new HttpError(400, "Invalid slug");
    }

    const chapter = await prisma.chapter.findUnique({
      where: { slug },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            creator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        pages: {
          select: {
            id: true,
            pageNo: true,
            imageUrl: true,
          },
          orderBy: { pageNo: "asc" },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    const now = new Date();
    const status: ChapterStatus = !chapter.publishedAt
      ? "hidden"
      : chapter.publishedAt > now
        ? "scheduled"
        : "published";

    let isOwnerPreview = false;

    // ถ้าเป็นตอนที่ยังไม่เผยแพร่ (ซ่อนหรือรอเผยแพร่)
    // อนุญาตให้เฉพาะเจ้าของผลงาน / แอดมินดูได้จากลิงก์นี้ (แสดงเป็นโหมด Preview)
    if (status !== "published") {
      const sessionToken = request.headers.get("x-session-token");
      if (!sessionToken) {
        // สำหรับผู้อ่านทั่วไป ให้แสดงเหมือนไม่มีตอนนี้
        throw new HttpError(404, "Chapter not found");
      }

      const user = await getUserBySessionToken(sessionToken);
      if (!user) {
        throw new HttpError(404, "Chapter not found");
      }

      // ตรวจสอบสิทธิ์ว่าจัดการมังงะนี้ได้หรือไม่ (เจ้าของผลงานหรือแอดมิน)
      await ensureCanManageManga({ id: user.id, role: user.role }, chapter.mangaId);
      isOwnerPreview = true;
    }

    // Get all chapters for this manga to find next/prev
    const allChapters = await prisma.chapter.findMany({
      where: { mangaId: chapter.mangaId },
      select: {
        id: true,
        number: true,
        slug: true,
        title: true,
      },
      orderBy: { number: "asc" },
    });

    const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
    const nextChapter =
      currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;

    // Check if user has purchased this chapter
    let isPurchased = false;
    let isOwner = false;
    const sessionToken = request.headers.get("x-session-token");
    if (sessionToken) {
      const user = await getUserBySessionToken(sessionToken);
      if (user) {
        // Check if user is the creator
        isOwner = chapter.manga.creator?.id === user.id;
        
        // Check if user has purchased this chapter
        if (!isOwner && chapter.isLocked) {
          const purchase = await prisma.coinTransaction.findFirst({
            where: {
              userId: user.id,
              type: "PURCHASE",
              status: "SUCCESS",
              metadata: {
                path: ["chapterId"],
                equals: chapter.id,
              },
            },
          });
          isPurchased = !!purchase;
        }
      }
    }

    return ok({
      chapter,
      nextChapter,
      prevChapter,
      status,
      isOwnerPreview,
      isLocked: chapter.isLocked,
      priceCoins: chapter.priceCoins,
      isPurchased,
      isOwner,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

