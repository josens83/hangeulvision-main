import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/http";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // ─── Zod validation ─────────────────────────────────────
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      message: "Request payload failed validation",
      issues: err.issues,
    });
  }

  // ─── App-level HTTP error ───────────────────────────────
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.code ?? httpCode(err.status),
      message: err.message,
      details: err.details,
    });
  }

  // ─── Prisma known errors ────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = err.meta as Record<string, unknown> | undefined;
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          error: "conflict",
          message: "A record with this value already exists.",
          target: meta?.target,
        });
      case "P2025":
        return res.status(404).json({
          error: "not_found",
          message: "Record not found.",
        });
      default:
        logger.warn(`Prisma known error: ${err.code}`);
        return res.status(400).json({
          error: "database_error",
          message: err.message,
          code: err.code,
        });
    }
  }

  // ─── JWT errors ─────────────────────────────────────────
  if (err instanceof Error) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid token.",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "unauthorized",
        message: "Token expired.",
      });
    }
  }

  // ─── Fallback ───────────────────────────────────────────
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : String(err);

  logger.error(`Unhandled error: ${err instanceof Error ? err.message : err}`);
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
