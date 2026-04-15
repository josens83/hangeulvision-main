import { Router } from "express";
import * as c from "../controllers/word.controller";
import { authOptional } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const wordRouter = Router();

wordRouter.get("/", authOptional, asyncHandler(c.list));
wordRouter.get("/search", authOptional, asyncHandler(c.search));
wordRouter.get("/daily", authOptional, asyncHandler(c.daily));
wordRouter.get("/count", authOptional, asyncHandler(c.count));
wordRouter.get("/by-exam/:exam", authOptional, asyncHandler(c.byExam));
wordRouter.get("/:id", authOptional, asyncHandler(c.getById));
wordRouter.get("/:id/examples", authOptional, asyncHandler(c.examples));
wordRouter.get("/:id/visuals", authOptional, asyncHandler(c.visuals));
wordRouter.get("/:id/related", authOptional, asyncHandler(c.related));
