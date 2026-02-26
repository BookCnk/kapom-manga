export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { checkInappropriateContent } from "@/lib/utils/content-filter";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  facebookUrl: z.string().url().nullable().optional(),
  tiktokUrl: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
});

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

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuth(request);
    const body = updateProfileSchema.parse(await request.json());

    if (body.name) {
      const nameCheck = checkInappropriateContent(body.name);
      if (nameCheck.isInappropriate) {
        throw new HttpError(
          400,
          "ชื่อที่แสดงมีคำต้องห้ามหรือคำที่เกี่ยวข้องกับ 18+",
        );
      }
    }

    const existing = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        avatarUrl: true,
        bannerUrl: true,
      },
    });

    if (body.bio) {
      const bioCheck = checkInappropriateContent(body.bio);
      if (bioCheck.isInappropriate) {
        throw new HttpError(
          400,
          "ข้อมูล 'เกี่ยวกับฉัน' มีคำต้องห้ามหรือคำที่เกี่ยวข้องกับ 18+",
        );
      }
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.facebookUrl !== undefined) data.facebookUrl = body.facebookUrl;
    if (body.tiktokUrl !== undefined) data.tiktokUrl = body.tiktokUrl;
    if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
    if (body.bannerUrl !== undefined) data.bannerUrl = body.bannerUrl;

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data,
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

    // ลบรูปเก่าออกจาก S3 ถ้ามีการเปลี่ยน avatar หรือ banner
    const bucket = process.env.S3_BUCKET_NAME;
    if (bucket && existing) {
      const urlsToDelete: string[] = [];

      if (
        existing.avatarUrl &&
        body.avatarUrl !== undefined &&
        body.avatarUrl !== existing.avatarUrl
      ) {
        urlsToDelete.push(existing.avatarUrl);
      }

      if (
        existing.bannerUrl &&
        body.bannerUrl !== undefined &&
        body.bannerUrl !== existing.bannerUrl
      ) {
        urlsToDelete.push(existing.bannerUrl);
      }

      if (urlsToDelete.length > 0) {
        try {
          const s3 = getS3Client();
          for (const url of urlsToDelete) {
            const key = extractKeyFromUrl(url, bucket);
            if (!key) continue;
            await s3.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
            );
          }
        } catch (err) {
          console.error("Failed to delete old profile images from S3:", err);
          // ไม่ต้อง throw ต่อ เพื่อไม่ให้การอัปเดตโปรไฟล์ล้มเหลว
        }
      }
    }

    return ok({ user: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

