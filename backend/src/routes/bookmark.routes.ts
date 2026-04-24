import { Router } from "express";
import * as c from "../controllers/bookmark.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const bookmarkRouter = Router();

bookmarkRouter.use(authRequired);

bookmarkRouter.get("/", asyncHandler(c.getBookmarks));
bookmarkRouter.get("/check", asyncHandler(c.checkBookmarks));
bookmarkRouter.post("/", asyncHandler(c.addBookmark));
bookmarkRouter.post("/toggle", asyncHandler(c.toggleBookmark));
bookmarkRouter.delete("/:wordId", asyncHandler(c.removeBookmark));
