import { Router } from "express";
import * as c from "../controllers/collection.controller";
import { asyncHandler } from "../utils/http";

export const collectionRouter = Router();

collectionRouter.get("/", asyncHandler(c.list));
collectionRouter.get("/:id", asyncHandler(c.getOne));
