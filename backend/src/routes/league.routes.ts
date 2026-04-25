import { Router } from "express";
import * as c from "../controllers/league.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const leagueRouter = Router();

leagueRouter.use(authRequired);
leagueRouter.get("/", asyncHandler(c.getLeague));
leagueRouter.post("/xp", asyncHandler(c.addXp));
