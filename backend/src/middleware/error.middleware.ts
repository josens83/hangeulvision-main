import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http";

/** Centralised error handler. Must be registered *after* all routes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      message: "Request payload failed validation",
      issues: err.issues,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.code ?? httpCode(err.status),
      message: err.message,
      details: err.details,
    });
  }

  // Fallback — never leak internal messages in production.
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : String(err);
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({ error: "internal_error", message });
}

function httpCode(status: number) {
  return (
    {
      400: "bad_request",
      401: "unauthorized",
      403: "forbidden",
      404: "not_found",
      409: "conflict",
      422: "unprocessable_entity",
    } as Record<number, string>
  )[status] ?? "error";
}
