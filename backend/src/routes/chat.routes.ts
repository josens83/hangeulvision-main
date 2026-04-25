import { Router } from "express";
import * as c from "../controllers/chat.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const chatRouter = Router();

chatRouter.post("/", authRequired, asyncHandler(c.chat));
