export const dynamic = "force-dynamic";

import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";

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

  const host = endpoint === "minio" ? "localhost" : endpoint;
  const withPort = port ? `${host}:${port}` : host;
  return `${protocol}://${withPort}/${bucket}/${key}`;
}

const ALLOWED_FOLDERS = new Set(["avatars", "profile-banners"]);

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new HttpError(500, "S3 bucket name is missing");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = (formData.get("folder")?.toString() || "avatars").replace(
      /^\/+|\/+$/g,
      "",
    );

    const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "avatars";

    if (!(file instanceof File)) {
      throw new HttpError(400, "file is required");
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);
    if (!allowedTypes.has(file.type)) {
      throw new HttpError(400, "Only jpg/jpeg/png/webp are allowed");
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new HttpError(400, "File size must be <= 2MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    let body = Buffer.from(arrayBuffer);

    // แปลงเป็น WebP เพื่อลดขนาดไฟล์ แต่ยังคงความคมชัดให้มากที่สุด
    try {
      body = await sharp(body)
        .webp({
          quality: 90, // คุณภาพสูง แต่ขนาดเล็กลงจากต้นฉบับ
          effort: 4,
        })
        .toBuffer();
    } catch (err) {
      console.error("Failed to convert profile image to WebP, using original:", err);
      // ถ้าแปลงไม่ได้ ให้ใช้ไฟล์ต้นฉบับต่อไป
    }

    const fileName = `${Date.now()}-${randomUUID()}.webp`;
    const key = `${folder}/${fileName}`;

    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
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

