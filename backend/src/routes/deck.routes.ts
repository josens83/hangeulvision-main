import { Router } from "express";
import * as c from "../controllers/deck.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const deckRouter = Router();

deckRouter.use(authRequired);

deckRouter.get("/", asyncHandler(c.list));
deckRouter.post("/", asyncHandler(c.create));
deckRouter.get("/:id", asyncHandler(c.getOne));
deckRouter.put("/:id", asyncHandler(c.update));
deckRouter.delete("/:id", asyncHandler(c.remove));
deckRouter.post("/:id/words", asyncHandler(c.addWord));
deckRouter.delete("/:id/words/:wordId", asyncHandler(c.removeWord));
