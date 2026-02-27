export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireRole } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

const cleanupSchema = z.object({
  urls: z.array(z.string().url()),
});

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

// แยก key จาก URL
function extractKeyFromUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [UserRole.TRANSLATOR, UserRole.ADMIN]);

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new HttpError(500, "S3 bucket name is missing");
    }

    const json = await request.json();
    const { urls } = cleanupSchema.parse(json);

    if (urls.length === 0) {
      return ok({ success: true, deleted: 0 });
    }

    const s3 = getS3Client();
    let deleted = 0;

    for (const url of urls) {
      const key = extractKeyFromUrl(url, bucket);
      if (!key) continue;

      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
        deleted += 1;
      } catch (err) {
        console.error("Failed to delete image during cleanup:", url, err);
        // ไม่ throw เพื่อให้ลูปดำเนินต่อ
      }
    }

    return ok({ success: true, deleted });
  } catch (error) {
    return handleRouteError(error);
  }
}

