export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, HttpError } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { ensureTranslatorOrAdmin } from "@/lib/api/permissions";
import JSZip from "jszip";

type Params = {
  params: {
    id: string;
  };
};

function parseChapterId(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid chapter id");
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(request);
    ensureTranslatorOrAdmin(actor);

    const chapterId = parseChapterId(params.id);

    // Fetch chapter with pages
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
        pages: {
          orderBy: { pageNo: "asc" },
        },
      },
    });

    if (!chapter) {
      throw new HttpError(404, "Chapter not found");
    }

    // Check if user can access this chapter (must be creator or admin)
    if (chapter.manga.creatorId !== actor.id && actor.role !== "ADMIN") {
      throw new HttpError(403, "Forbidden");
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add all pages to ZIP
    for (const page of chapter.pages) {
      try {
        // If imageUrl is a data URL, extract base64 data
        let imageData: Buffer;
        if (page.imageUrl.startsWith("data:")) {
          const base64Data = page.imageUrl.split(",")[1] || page.imageUrl;
          imageData = Buffer.from(base64Data, "base64");
        } else {
          // If it's a URL, fetch it
          const imageResponse = await fetch(page.imageUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch image for page ${page.pageNo}`);
            continue;
          }
          const arrayBuffer = await imageResponse.arrayBuffer();
          imageData = Buffer.from(arrayBuffer);
        }

        // Determine file extension from imageUrl or default to jpg
        const extension = page.imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[0]?.toLowerCase() || ".jpg";
        const fileName = `${page.pageNo}${extension}`;

        zip.file(fileName, imageData);
      } catch (error) {
        console.error(`Error processing page ${page.pageNo}:`, error);
        // Continue with other pages
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return ZIP file
    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${chapter.manga.title}-ตอนที่-${chapter.number}.zip"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

