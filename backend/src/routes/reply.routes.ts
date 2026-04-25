import { Router } from "express";
import * as c from "../controllers/reply.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const replyRouter = Router();

replyRouter.use(authRequired);
replyRouter.post("/", asyncHandler(c.create));
replyRouter.get("/mine", asyncHandler(c.mine));
