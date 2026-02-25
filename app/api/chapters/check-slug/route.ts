export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, ok } from "@/lib/api/http";

const checkSlugSchema = z.object({
  slug: z.string().trim().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get("slug");

    if (!slug) {
      return ok({ exists: false });
    }

    // Check if slug exists globally (slug is now unique globally)
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug },
    });

    return ok({ exists: !!existingChapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = checkSlugSchema.parse(await request.json());

    // Check if slug exists globally (slug is now unique globally)
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug: body.slug },
    });

    return ok({ exists: !!existingChapter });
  } catch (error) {
    return handleRouteError(error);
  }
}

