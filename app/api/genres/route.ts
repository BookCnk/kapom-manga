export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { handleRouteError, ok } from "@/lib/api/http";
import { allGenres } from "@/lib/config/genres";

export async function GET(_request: NextRequest) {
  try {
    // Return genres from config file
    return ok({ genres: allGenres });
  } catch (error) {
    return handleRouteError(error);
  }
}

