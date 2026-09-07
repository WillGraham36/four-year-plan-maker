import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResult } from "@/server/dto/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, message?: string, status = 200) {
  return NextResponse.json<ApiResult<T>>(
    { ok: true, data, ...(message ? { message } : {}) },
    { status },
  );
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json<ApiResult<never>>(
    {
      ok: false,
      data: null,
      message,
      error: { code, message, ...(details === undefined ? {} : { details }) },
    },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail(400, "VALIDATION_ERROR", "Invalid request", error.flatten());
  }

  console.error("Next API route failed", error);
  return fail(500, "INTERNAL_ERROR", "An unexpected error occurred");
}

export async function route<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    return handleRouteError(error);
  }
}

