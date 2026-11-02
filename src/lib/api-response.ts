import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

/**
 * Standardized success response helper
 */
export function successResponse<T>(data: T, status = 200, meta?: ApiResponse["meta"]) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

/**
 * Standardized error response helper
 */
export function errorResponse(error: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}
