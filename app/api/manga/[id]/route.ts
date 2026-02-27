export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { MangaStatus, Visibility } from "@prisma/client";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageManga,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";
import { getGenreBySlug } from "@/lib/config/genres";
import { contentTypeValues } from "@/lib/config/contentTypes";

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 configuration is missing");
  }

  const protocol = useSsl ? "https" : "http";
  const fullEndpoint = port
    ? `${protocol}://${endpoint}:${port}`
    : `${protocol}://${endpoint}`;

  return new S3Client({
    region: "us-east-1",
    endpoint: fullEndpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function extractKeyFromUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function deleteS3Image(url: string) {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket || !url) return;
  try {
    const key = extractKeyFromUrl(url, bucket);
    if (!key) return;
    const s3 = getS3Client();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error("Failed to delete old image from S3:", err);
  }
}

type Params = {
  params: {
    id: string;
  };
};

const contentTypeEnum = z.enum(
  contentTypeValues as [string, ...string[]],
);

const updateMangaSchema = z.object({
  slug: z.string().trim().min(2).max(120).optional(),
  // จำกัดชื่อเรื่องสูงสุด 120 ตัวอักษร
  title: z.string().trim().min(1).max(120).optional(),
  // จำกัดชื่อเรื่องต้นฉบับสูงสุด 120 ตัวอักษร
  originalTitle: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  status: z.nativeEnum(MangaStatus).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  isMature: z.boolean().optional(),
  contentType: contentTypeEnum.optional(),
  genreSlugs: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1).max(20)).optional().default([]),
});

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const mangaId = parseId(params.id);
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        chapters: {
          select: {
            id: true,
            number: true,
            title: true,
            slug: true,
            isLocked: true,
            priceCoins: true,
          },
          orderBy: { number: "asc" },
        },
      },
    });

    if (!manga) {
      throw new HttpError(404, "Manga not found");
    }

    return ok({ manga });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseId(params.id);
    await ensureCanManageManga(actor, mangaId);

    const body = updateMangaSchema.parse(await request.json());
    const { genreSlugs, tags, ...mangaData } = body;

    // ดึงข้อมูลรูปเดิมก่อนอัปเดต เพื่อลบรูปเก่าจาก S3
    const existing = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { coverUrl: true, bannerUrl: true },
    });

    // Validate genre slugs if provided
    if (genreSlugs !== undefined) {
      const slugs = Array.isArray(genreSlugs) ? genreSlugs : [];
      for (const slug of slugs) {
        if (!getGenreBySlug(slug)) {
          throw new HttpError(400, `Invalid genre slug: ${slug}`);
        }
      }
      (mangaData as any).genreSlugs = slugs;
    }

    // Update manga with genres and tags in a transaction
    const manga = await prisma.$transaction(async (tx) => {
      // Update tags if provided - convert to slugs and store in tagSlugs array
      if (tags !== undefined) {
        const tagSlugs = Array.isArray(tags) && tags.length > 0
          ? tags.map((tagName: string) => {
              const tagSlug = tagName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

              return tagSlug || encodeURIComponent(tagName.trim()).toLowerCase();
            }).filter((slug) => slug.length > 0)
          : [];

        (mangaData as any).tagSlugs = tagSlugs;
      }

      // Update manga basic info
      const updatedManga = await tx.manga.update({
        where: { id: mangaId },
        data: mangaData,
      });

      return updatedManga;
    });

    // ลบรูปเก่าจาก S3 หลังอัปเดตสำเร็จ
    if (existing) {
      if (
        existing.coverUrl &&
        body.coverUrl !== undefined &&
        body.coverUrl !== existing.coverUrl
      ) {
        await deleteS3Image(existing.coverUrl);
      }
      if (
        existing.bannerUrl &&
        body.bannerUrl !== undefined &&
        body.bannerUrl !== existing.bannerUrl
      ) {
        await deleteS3Image(existing.bannerUrl);
      }
    }

    return ok({ manga });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseId(params.id);
    await ensureCanManageManga(actor, mangaId);

    // ดึงข้อมูลรูปก่อนลบ เพื่อลบรูปจาก S3 ด้วย
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { coverUrl: true, bannerUrl: true },
    });

    await prisma.manga.delete({ where: { id: mangaId } });

    // ลบรูปจาก S3 หลังลบมังงะสำเร็จ
    if (manga) {
      if (manga.coverUrl) await deleteS3Image(manga.coverUrl);
      if (manga.bannerUrl) await deleteS3Image(manga.bannerUrl);
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
