import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api/http";

type Actor = {
  id: number;
  role: UserRole;
};

export function ensureTranslatorOrAdmin(actor: Actor) {
  if (actor.role !== UserRole.TRANSLATOR && actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Only translators can perform this action");
  }
}

export async function ensureCanManageManga(actor: Actor, mangaId: number) {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: { id: true, creatorId: true },
  });

  if (!manga) throw new HttpError(404, "Manga not found");
  if (actor.role === UserRole.ADMIN) return manga;
  if (manga.creatorId !== actor.id) {
    throw new HttpError(403, "You can only manage your own manga");
  }
  return manga;
}

export async function ensureCanManageChapter(actor: Actor, chapterId: number) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, mangaId: true, manga: { select: { creatorId: true } } },
  });

  if (!chapter) throw new HttpError(404, "Chapter not found");
  if (actor.role === UserRole.ADMIN) return chapter;
  if (chapter.manga.creatorId !== actor.id) {
    throw new HttpError(403, "You can only manage chapters in your own manga");
  }
  return chapter;
}

export async function ensureCanManagePage(actor: Actor, pageId: number) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      chapterId: true,
      chapter: {
        select: { manga: { select: { creatorId: true } } },
      },
    },
  });

  if (!page) throw new HttpError(404, "Page not found");
  if (actor.role === UserRole.ADMIN) return page;
  if (page.chapter.manga.creatorId !== actor.id) {
    throw new HttpError(403, "You can only manage pages in your own manga");
  }
  return page;
}
