import express, { Router } from "express";
import * as c from "../controllers/paddle.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const paddleRouter = Router();

// Webhook — no auth (Paddle calls directly; signature verified in controller).
// rawBody is captured by the global express.json verify callback in index.ts.
paddleRouter.post("/webhook", asyncHandler(c.webhook));

// Authenticated endpoints
paddleRouter.post("/checkout", authRequired, asyncHandler(c.createCheckout));
paddleRouter.post("/portal", authRequired, asyncHandler(c.customerPortal));
paddleRouter.get("/prices", asyncHandler(c.listPrices));
