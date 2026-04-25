import { Router } from "express";
import * as c from "../controllers/announcement.controller";
import { asyncHandler } from "../utils/http";

export const announcementRouter = Router();

announcementRouter.get("/", asyncHandler(c.list));
