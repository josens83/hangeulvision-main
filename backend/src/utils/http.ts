import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async handler so thrown errors flow into Express' error handler
 * instead of becoming unhandled promise rejections.
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  constructor(status: number, message: string, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export const notFound = (message = "Not found") => new HttpError(404, message);
export const badRequest = (message = "Bad request", details?: unknown) =>
  new HttpError(400, message, { details });
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message);
export const forbidden = (message = "Forbidden") => new HttpError(403, message);
export const conflict = (message = "Conflict") => new HttpError(409, message);
