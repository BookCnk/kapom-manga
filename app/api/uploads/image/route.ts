export const dynamic = "force-dynamic";

import { randomBytes } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

// สร้างชื่อไฟล์สั้นๆ แต่ไม่ซ้ำ (timestamp + random 6 ตัวอักษร)
function generateShortFileName(extension: string): string {
  const timestamp = Date.now().toString(36); // base36 encoding ทำให้สั้นลง
  const randomStr = randomBytes(3).toString("hex"); // 6 ตัวอักษร
  return `${timestamp}-${randomStr}.${extension}`;
}

// แยก key จาก URL
function extractKeyFromUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new HttpError(500, "S3 configuration is missing");
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

function buildPublicUrl(bucket: string, key: string) {
  const explicitBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (explicitBaseUrl) {
    return `${explicitBaseUrl.replace(/\/$/, "")}/${bucket}/${key}`;
  }

  const endpoint = process.env.S3_ENDPOINT;
  const port = process.env.S3_PORT;
  const useSsl = process.env.S3_USE_SSL === "true";
  if (!endpoint) {
    throw new HttpError(500, "S3 endpoint is missing");
  }

  const protocol = useSsl ? "https" : "http";

  // In local Docker, browser cannot resolve "minio" hostname.
  const host = endpoint === "minio" ? "localhost" : endpoint;
  const withPort = port ? `${host}:${port}` : host;
  return `${protocol}://${withPort}/${bucket}/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new HttpError(500, "S3 bucket name is missing");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder")?.toString() || "manga-covers").replace(/^\/+|\/+$/g, "");
    const oldUrl = formData.get("oldUrl")?.toString();

    if (!(file instanceof File)) {
      throw new HttpError(400, "file is required");
    }

    const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      throw new HttpError(400, "Only jpg/jpeg/png/webp are allowed");
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new HttpError(400, "File size must be <= 2MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
    const fileName = generateShortFileName(extension || "jpg");
    const key = `${folder}/${fileName}`;

    const s3 = getS3Client();
    
    // ลบรูปเก่าถ้ามี oldUrl
    if (oldUrl) {
      try {
        const oldKey = extractKeyFromUrl(oldUrl, bucket);
        if (oldKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: oldKey,
            }),
          );
        }
      } catch (err) {
        console.error("Failed to delete old image:", err);
        // ไม่ throw error เพื่อไม่ให้การอัพโหลดล้มเหลว
      }
    }

    // อัพโหลดรูปใหม่
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      }),
    );

    return ok({
      url: buildPublicUrl(bucket, key),
      key,
      bucket,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

