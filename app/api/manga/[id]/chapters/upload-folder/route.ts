export const dynamic = "force-dynamic";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError, ok } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import {
  ensureCanManageManga,
  ensureTranslatorOrAdmin,
} from "@/lib/api/permissions";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

// สร้างชื่อไฟล์สั้นๆ แต่ไม่ซ้ำ
function generateShortFileName(extension: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = randomBytes(3).toString("hex");
  return `${timestamp}-${randomStr}.${extension}`;
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

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return mimeMap[ext] || "image/jpeg";
}

type Params = {
  params: {
    id: string;
  };
};

const uploadFolderSchema = z.object({
  defaultPrice: z
    .number()
    .min(0)
    .default(0)
    .transform((v) => Math.round(v * 100) / 100),
  defaultStatus: z.enum(["published", "draft"]).default("published"),
});

function parseMangaId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid manga id");
  }
  return parsed;
}

// Extract chapter number from folder name (e.g., "ตอนที่ 1" -> 1)
function extractChapterNumber(folderName: string): number | null {
  const match = folderName.match(/ตอนที่\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    return parseFloat(match[1]);
  }
  // Try to extract number from filename (e.g., "ตอนที่23.zip" -> 23)
  const filenameMatch = folderName.match(/(\d+(?:\.\d+)?)/);
  if (filenameMatch) {
    return parseFloat(filenameMatch[1]);
  }
  return null;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const mangaId = parseMangaId(params.id);
    await ensureCanManageManga(actor, mangaId);

    const formData = await request.formData();
    const validatedData = uploadFolderSchema.parse({
      defaultPrice: formData.get("defaultPrice")
        ? parseFloat(formData.get("defaultPrice") as string)
        : 0,
      defaultStatus: formData.get("defaultStatus") || "published",
    });

    // Get all files from FormData
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      throw new HttpError(400, "No files uploaded");
    }

    // Group files by folder structure
    const folderMap = new Map<string, File[]>();

    files.forEach((file) => {
      const relativePath = file.name; // This will be like "001/001.jpg"
      const pathParts = relativePath.split("/");

      if (pathParts.length > 1) {
        const folderName = pathParts[0];
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(file);
      }
    });

    // Convert folder map to chapter data
    const chaptersData: Array<{
      number: number;
      title: string;
      folderName: string;
      imageFiles: File[];
    }> = [];

    for (const [folderName, folderFiles] of folderMap) {
      const chapterNumber = extractChapterNumber(folderName);
      if (!chapterNumber) {
        console.warn(`Skipping folder with invalid name: ${folderName}`);
        continue;
      }

      // Filter and sort image files
      const imageFiles = folderFiles
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file.name))
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );

      if (imageFiles.length === 0) {
        console.warn(`No image files found in folder: ${folderName}`);
        continue;
      }

      chaptersData.push({
        number: chapterNumber,
        title: `ตอนที่ ${chapterNumber}`,
        folderName,
        imageFiles,
      });
    }

    if (chaptersData.length === 0) {
      throw new HttpError(400, "No valid chapters found in uploaded folders");
    }

    // Check for existing chapters
    const existingChapters = await prisma.chapter.findMany({
      where: { mangaId },
      select: { number: true },
    });

    const existingNumbers = new Set(existingChapters.map((ch) => ch.number));
    const validChapters = chaptersData.filter(
      (ch) => !existingNumbers.has(ch.number),
    );

    if (validChapters.length === 0) {
      throw new HttpError(400, "All chapters already exist");
    }

    // Get S3 client
    const s3Client = getS3Client();
    const bucket = process.env.S3_BUCKET_NAME || "manga-uploads";

    // Process each chapter
    const createdChapters = [];
    let totalUploadedFiles = 0;

    for (const chapterData of validChapters) {
      try {
        // Create chapter in database
        const chapterSlug = `${chapterData.number.toString().padStart(3, "0")}-${Date.now().toString(36)}`;

        const chapter = await prisma.chapter.create({
          data: {
            mangaId,
            number: chapterData.number,
            title: chapterData.title,
            slug: chapterSlug,
            isLocked: validatedData.defaultPrice > 0,
            priceCoins: validatedData.defaultPrice,
            publishedAt:
              validatedData.defaultStatus === "published" ? new Date() : null,
          },
        });

        // Upload images and create pages
        const uploadedUrls = [];

        for (let i = 0; i < chapterData.imageFiles.length; i++) {
          const file = chapterData.imageFiles[i];
          const fileExtension =
            file.name.split(".").pop()?.toLowerCase() || "jpg";
          const fileName = generateShortFileName(fileExtension);
          const key = `manga/${mangaId}/chapters/${chapter.id}/${fileName}`;

          // Process image with Sharp
          const imageBuffer = Buffer.from(await file.arrayBuffer());

          // Optimize image
          const processedBuffer = await sharp(imageBuffer)
            .resize(null, 1200, { withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();

          // Upload to S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: processedBuffer,
              ContentType: getContentType(file.name),
            }),
          );

          const publicUrl = buildPublicUrl(bucket, key);
          uploadedUrls.push(publicUrl);

          // Create page record
          await prisma.page.create({
            data: {
              chapterId: chapter.id,
              pageNo: i + 1,
              imageUrl: publicUrl,
            },
          });

          totalUploadedFiles++;
        }

        createdChapters.push({
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          pageCount: chapterData.imageFiles.length,
        });
      } catch (error) {
        console.error(`Error processing chapter ${chapterData.number}:`, error);
        // Continue with other chapters
      }
    }

    if (createdChapters.length === 0) {
      throw new HttpError(500, "Failed to create any chapters");
    }

    return ok({
      success: true,
      data: {
        createdChapters,
        totalUploadedFiles,
        skippedChapters: chaptersData.length - validChapters.length,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
