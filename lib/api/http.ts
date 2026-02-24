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
  return NextResponse.json(data, { status });
}

export function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.status, error.message);
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request body", details: error.flatten() },
      { status: 400 },
    );
  }

  console.error(error);
  return fail(500, "Internal server error");
}

