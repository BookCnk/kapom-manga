export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageChapter,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null; // ไม่มี S3 config → ข้ามการลบรูป
  }

  const protocol = useSsl ? "https" : "http";
  const fullEndpoint = port ? `${protocol}://${endpoint}:${port}` : `${protocol}://${endpoint}`;

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

type Params = {
  params: {
    id: string;
  };
};

const updateChapterSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  number: z.number().positive().optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  isLocked: z.boolean().optional(),
  priceCoins: z.number().min(0).optional().transform((v) => v !== undefined ? Math.round(v * 100) / 100 : undefined),
  publishedAt: z.string().datetime().nullable().optional(),
});

function parseChapterId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid chapter id");
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const chapterId = parseChapterId(params.id);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        pages: {
          select: { id: true, pageNo: true, imageUrl: true },
          orderBy: { pageNo: "asc" },
        },
      },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    return ok({ chapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);
    await ensureCanManageChapter(actor, chapterId);
    const body = updateChapterSchema.parse(await request.json());

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...body,
        publishedAt:
          body.publishedAt === undefined
            ? undefined
            : body.publishedAt === null
              ? null
              : new Date(body.publishedAt),
      },
    });

    return ok({ chapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);
    await ensureCanManageChapter(actor, chapterId);

    // ดึงข้อมูลตอน + รูปทั้งหมดก่อนลบ
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        number: true,
        manga: { select: { slug: true } },
        pages: { select: { imageUrl: true } },
      },
    });
    if (!chapter) throw new HttpError(404, "Chapter not found");

    // ลบตอนจากฐานข้อมูล (cascade จะลบ pages ด้วย)
    await prisma.chapter.delete({ where: { id: chapterId } });

    // ลบโฟลเดอร์ตอนและรูปจาก S3 แบบ fire-and-forget
    const bucket = process.env.S3_BUCKET_NAME;
    const s3 = getS3Client();

    if (s3 && bucket) {
      const folderPrefix = `manga/${chapter.manga.slug}/episodes/${chapter.number}/`;
      Promise.resolve().then(async () => {
        try {
          const listRes = await s3.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: folderPrefix }),
          );
          const objects = listRes.Contents ?? [];
          if (objects.length > 0) {
            await s3.send(
              new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: {
                  Objects: objects.map((o) => ({ Key: o.Key! })),
                  Quiet: true,
                },
              }),
            );
          }
        } catch (err) {
          console.error("Failed to delete S3 folder:", folderPrefix, err);
        }
        // fallback: ลบทีละไฟล์ (กรณี orphaned files นอก prefix)
        const imageUrls = chapter.pages
          .map((p) => p.imageUrl)
          .filter((url): url is string => !!url);
        await Promise.allSettled(
          imageUrls.map(async (url) => {
            const key = extractKeyFromUrl(url, bucket);
            if (!key) return;
            try {
              await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
            } catch {}
          }),
        );
      }).catch(() => {});
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}


