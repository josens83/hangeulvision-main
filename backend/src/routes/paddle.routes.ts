import express, { Router } from "express";
import * as c from "../controllers/paddle.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const paddleRouter = Router();

// Webhook needs the raw body for signature verification.
paddleRouter.post(
  "/webhook",
  express.raw({ type: "*/*", limit: "2mb" }),
  asyncHandler(c.webhook),
);

// Authenticated endpoints
paddleRouter.post("/checkout", authRequired, asyncHandler(c.createCheckout));
paddleRouter.post("/portal", authRequired, asyncHandler(c.customerPortal));
paddleRouter.get("/prices", asyncHandler(c.listPrices));
