import { Router } from "express";
import * as c from "../controllers/payments.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const paymentsRouter = Router();

// TossPayments (Korea) webhooks are unauthenticated — verified via signature.
paymentsRouter.post("/toss/webhook", asyncHandler(c.tossWebhook));
paymentsRouter.post("/toss/confirm", authRequired, asyncHandler(c.tossConfirm));

// User history
paymentsRouter.get("/", authRequired, asyncHandler(c.list));
paymentsRouter.get("/:id", authRequired, asyncHandler(c.getOne));
paymentsRouter.post("/:id/refund", authRequired, asyncHandler(c.requestRefund));
