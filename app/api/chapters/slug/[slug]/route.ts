import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(_request: NextRequest, { params }: Params) {
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
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;

    return ok({
      chapter,
      nextChapter,
      prevChapter,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
