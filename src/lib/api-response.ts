/**
 * Standardized API response formats
 * Ensures consistent response structure across all endpoints
 */

import { NextResponse } from "next/server";

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

/**
 * Success response (200/201)
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as APIResponse<T>,
    { status }
  );
}

/**
 * Paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error response
 */
export function errorResponse(
  message: string,
  code: string = "ERROR",
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    } as APIResponse<null>,
    { status }
  );
}
