import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// Helper to get data from ok response
export function getOkData<T>(response: { success: true; data: T }): T {
  return response.data;
}

export function fail(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.status, error.message);
  }

  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { success: false, error: firstError || "ข้อมูลไม่ถูกต้อง", details: error.flatten() },
      { status: 400 },
    );
  }

  console.error(error);
  return fail(500, "Internal server error");
}

