import { Router } from "express";
import * as c from "../controllers/package.controller";
import { authOptional, authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const packageRouter = Router();

packageRouter.get("/", authOptional, asyncHandler(c.list));
packageRouter.get("/:slug", authOptional, asyncHandler(c.getBySlug));
packageRouter.get("/:slug/words", authOptional, asyncHandler(c.words));

// Per-user
packageRouter.get("/me/access", authRequired, asyncHandler(c.myAccess));
