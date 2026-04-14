import { Router } from "express";
import * as c from "../controllers/progress.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const progressRouter = Router();

progressRouter.use(authRequired);

progressRouter.get("/", asyncHandler(c.list));
progressRouter.get("/summary", asyncHandler(c.summary));
progressRouter.get("/:wordId", asyncHandler(c.getOne));
progressRouter.post("/:wordId/grade", asyncHandler(c.grade));
progressRouter.delete("/:wordId", asyncHandler(c.reset));
