import { NextRequest } from "next/server";
import { HttpError, handleRouteError } from "@/lib/api/http";

/**
 * This endpoint has been removed.
 * Unread count is now included in /api/notifications response.
 * This route returns 404 to prevent any cached code from calling it.
 */
export async function GET(request: NextRequest) {
  return handleRouteError(new HttpError(404, "This endpoint has been removed. Use /api/notifications instead."));
}
