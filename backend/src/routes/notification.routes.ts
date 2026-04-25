import { Router } from "express";
import * as c from "../controllers/notification.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const notificationRouter = Router();

notificationRouter.use(authRequired);

notificationRouter.get("/", asyncHandler(c.list));
notificationRouter.get("/unread-count", asyncHandler(c.unreadCount));
notificationRouter.put("/read-all", asyncHandler(c.markAllRead));
notificationRouter.put("/:id/read", asyncHandler(c.markRead));
