import { Router } from "express";
import * as c from "../controllers/goals.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const goalsRouter = Router();

goalsRouter.use(authRequired);

goalsRouter.get("/daily", asyncHandler(c.getDailyGoal));
goalsRouter.put("/daily", asyncHandler(c.updateDailyGoal));
goalsRouter.post("/progress", asyncHandler(c.incrementProgress));
goalsRouter.get("/stats", asyncHandler(c.getStats));
