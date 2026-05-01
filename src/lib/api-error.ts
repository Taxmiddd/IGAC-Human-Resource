/**
 * Centralized error handling for API routes
 * Provides consistent error responses and logging
 */

import { NextResponse } from "next/server";

export class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Wraps async API handler with error catching and logging
 * Usage: export const GET = handleAPIError(async (req, ctx) => { ... })
 */
export function handleAPIError<T extends any[], R>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      // Log error for debugging
      console.error("[API Error]", {
        timestamp: new Date().toISOString(),
        error: error?.message || String(error),
        stack: error?.stack,
      });

      // Return appropriate error response
      if (error instanceof APIError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status }
        );
      }

      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid request body", code: "PARSE_ERROR" },
          { status: 400 }
        );
      }

      // Generic 500 error (don't expose details)
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
