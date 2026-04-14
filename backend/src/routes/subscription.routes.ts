import { Router } from "express";
import * as c from "../controllers/subscription.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const subscriptionRouter = Router();

subscriptionRouter.use(authRequired);

subscriptionRouter.get("/", asyncHandler(c.current));
subscriptionRouter.post("/upgrade", asyncHandler(c.upgrade));
subscriptionRouter.post("/downgrade", asyncHandler(c.downgrade));
subscriptionRouter.post("/cancel", asyncHandler(c.cancel));
subscriptionRouter.post("/resume", asyncHandler(c.resume));
subscriptionRouter.get("/invoices", asyncHandler(c.invoices));
