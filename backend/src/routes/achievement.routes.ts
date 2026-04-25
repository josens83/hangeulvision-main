import { Router } from "express";
import * as c from "../controllers/achievement.controller";
import { authOptional, authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const achievementRouter = Router();

achievementRouter.get("/", authOptional, asyncHandler(c.list));
achievementRouter.post("/check", authRequired, asyncHandler(c.check));
