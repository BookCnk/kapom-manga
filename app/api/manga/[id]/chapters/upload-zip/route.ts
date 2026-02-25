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

type Params = {
  params: {
    id: string;
  };
};

const uploadZipSchema = z.object({
  zipFile: z.string(), // base64 encoded ZIP file
  zipFileName: z.string(),
  defaultPrice: z.number().int().min(0).default(0),
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

    // Create chapters and pages
    const createdChapters = [];
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

      // Create pages
      for (let i = 0; i < chapterData.images.length; i++) {
        const image = chapterData.images[i];
        // Convert buffer to base64 for storage (in production, upload to storage service)
        const base64 = image.data.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        await prisma.page.create({
          data: {
            chapterId: chapter.id,
            pageNo: i + 1,
            imageUrl: dataUrl, // In production, upload to storage and use URL
          },
        });
      }

      createdChapters.push(chapter);
    }

    return ok({
      chaptersCreated: createdChapters.length,
      chapters: createdChapters,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
