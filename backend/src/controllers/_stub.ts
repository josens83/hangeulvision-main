import type { Request, Response } from "express";

/**
 * Uniform "not-yet-implemented" response for route stubs.
 * Controllers replace these with real logic as the backend comes online.
 */
export function stub(name: string) {
  return async (req: Request, res: Response) => {
    res.status(501).json({
      error: "not_implemented",
      handler: name,
      method: req.method,
      path: req.originalUrl,
      message:
        "Route is scaffolded — implementation lands when the Supabase database is provisioned.",
    });
  };
}
