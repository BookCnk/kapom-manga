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
import JSZip from "jszip";
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

const uploadZipSchema = z.object({
  zipFile: z.string(), // base64 encoded ZIP file
  zipFileName: z.string(),
  defaultPrice: z.number().min(0).default(0).transform((v) => Math.round(v * 100) / 100),
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

    const body = uploadZipSchema.parse(await request.json());

    // Decode base64 ZIP file
    const zipData = body.zipFile.split(",")[1] || body.zipFile; // Remove data URL prefix if present
    const zipBuffer = Buffer.from(zipData, "base64");

    // Load ZIP file
    const zip = await JSZip.loadAsync(zipBuffer);

    // Get all files in ZIP
    const files = Object.keys(zip.files);

    // Determine if it's single or multi chapter structure
    const hasFolders = files.some((file) => zip.files[file].dir);
    let chaptersData: Array<{
      number: number;
      title: string;
      images: Array<{ name: string; data: Buffer }>;
    }> = [];

    if (hasFolders) {
      // Multi chapter structure: folders with "ตอนที่ X" names
      const folders = files.filter((file) => zip.files[file].dir);
      
      for (const folder of folders) {
        const folderName = folder.replace(/\/$/, ""); // Remove trailing slash
        const chapterNumber = extractChapterNumber(folderName);
        
        if (!chapterNumber) {
          console.warn(`Skipping folder with invalid name: ${folderName}`);
          continue;
        }

        // Get all image files in this folder
        const folderFiles = files.filter(
          (file) => file.startsWith(folder) && !zip.files[file].dir
        );

        // Sort files by name (numeric)
        const sortedFiles = folderFiles.sort((a, b) => {
          const nameA = a.replace(folder, "").toLowerCase();
          const nameB = b.replace(folder, "").toLowerCase();
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
        });

        // Extract image files
        const images = [];
        for (const file of sortedFiles) {
          const fileData = zip.files[file];
          if (!fileData.dir) {
            const imageBuffer = await fileData.async("nodebuffer");
            const fileName = file.replace(folder, "");
            // Only include image files
            if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
              images.push({
                name: fileName,
                data: imageBuffer,
              });
            }
          }
        }

        if (images.length > 0) {
          chaptersData.push({
            number: chapterNumber,
            title: `ตอนที่ ${chapterNumber}`,
            images,
          });
        }
      }
    } else {
      // Single chapter structure: images directly in ZIP root
      // Try to extract chapter number from ZIP filename
      const chapterNumber = extractChapterNumber(body.zipFileName) || 1;

      // Get all image files
      const imageFiles = files
        .filter((file) => !zip.files[file].dir && /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort((a, b) => {
          const nameA = a.toLowerCase();
          const nameB = b.toLowerCase();
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
        });

      const images = [];
      for (const file of imageFiles) {
        const fileData = zip.files[file];
        const imageBuffer = await fileData.async("nodebuffer");
        images.push({
          name: file,
          data: imageBuffer,
        });
      }

      if (images.length > 0) {
        chaptersData.push({
          number: chapterNumber,
          title: `ตอนที่ ${chapterNumber}`,
          images,
        });
      }
    }

    if (chaptersData.length === 0) {
      throw new HttpError(400, "ไม่พบไฟล์รูปภาพใน ZIP");
    }

    // ดึง slug ของมังงะเพื่อใช้สร้างโฟลเดอร์ใน S3
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { slug: true },
    });
    if (!manga) {
      throw new HttpError(404, "ไม่พบมังงะ");
    }

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new HttpError(500, "S3 bucket name is missing");
    }

    const s3 = getS3Client();

    // Create chapters and pages
    const createdChapters = [];
    const chapterResults: Array<{
      number: number;
      title: string;
      status: "success" | "skipped" | "error";
      message?: string;
    }> = [];

    for (const chapterData of chaptersData) {
      // Check if chapter number already exists
      const existingChapter = await prisma.chapter.findFirst({
        where: {
          mangaId,
          number: chapterData.number,
        },
      });

      if (existingChapter) {
        console.warn(`Chapter ${chapterData.number} already exists, skipping`);
        chapterResults.push({
          number: chapterData.number,
          title: chapterData.title,
          status: "skipped",
          message: `ตอนที่ ${chapterData.number} มีอยู่แล้ว (ซ้ำ)`,
        });
        continue;
      }

      // Generate unique random slug for chapter
      const generateRandomSlug = (): string => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 20; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // Check if slug exists globally and generate unique one (slug is now unique globally)
      let chapterSlug = generateRandomSlug();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.chapter.findUnique({
          where: { slug: chapterSlug },
        });
        if (!existing) break;
        chapterSlug = generateRandomSlug();
        attempts++;
      }

      try {
        const chapter = await prisma.chapter.create({
          data: {
            mangaId,
            title: chapterData.title,
            number: chapterData.number,
            slug: chapterSlug,
            isLocked: body.defaultPrice > 0,
            priceCoins: body.defaultPrice,
            publishedAt: body.defaultStatus === "published" ? new Date() : undefined,
          },
        });

        // อัพโหลดรูปภาพแต่ละหน้าไป S3 (แปลงเป็น WebP + resize ให้เหมาะกับการอ่าน)
        // โครงสร้าง: manga/{slug}/episodes/{chapterNumber}/
        for (let i = 0; i < chapterData.images.length; i++) {
          const image = chapterData.images[i];

          // Resize กว้างสุด ~1600px และแปลงเป็น WebP เพื่อลดขนาดไฟล์ โดยคงความคมชัด
          const webpBuffer = await sharp(image.data)
            .resize({
              width: 1600,
              withoutEnlargement: true,
            })
            .webp({
              quality: 86,
              effort: 6,
              smartSubsample: true,
            })
            .toBuffer();

          const fileName = generateShortFileName("webp");
          const key = `manga/${manga.slug}/episodes/${chapterData.number}/${fileName}`;

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: webpBuffer,
              ContentType: "image/webp",
            }),
          );

          const imageUrl = buildPublicUrl(bucket, key);

          await prisma.page.create({
            data: {
              chapterId: chapter.id,
              pageNo: i + 1,
              imageUrl,
            },
          });
        }

        createdChapters.push(chapter);
        chapterResults.push({
          number: chapterData.number,
          title: chapterData.title,
          status: "success",
          message: `ตอนที่ ${chapterData.number} อัพโหลดสำเร็จ (${chapterData.images.length} หน้า)`,
        });
      } catch (error) {
        console.error(`Error creating chapter ${chapterData.number}:`, error);
        chapterResults.push({
          number: chapterData.number,
          title: chapterData.title,
          status: "error",
          message: `ตอนที่ ${chapterData.number} เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return ok({
      chaptersCreated: createdChapters.length,
      chapters: createdChapters,
      results: chapterResults,
      total: chaptersData.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

