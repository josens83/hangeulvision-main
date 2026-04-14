import { Router } from "express";
import * as c from "../controllers/learning.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const learningRouter = Router();

learningRouter.use(authRequired);

learningRouter.post("/sessions", asyncHandler(c.startSession));
learningRouter.get("/sessions/:id", asyncHandler(c.getSession));
learningRouter.post("/sessions/:id/progress", asyncHandler(c.recordProgress));
learningRouter.post("/sessions/:id/complete", asyncHandler(c.completeSession));
learningRouter.get("/queue", asyncHandler(c.reviewQueue));
learningRouter.get("/stats", asyncHandler(c.stats));
