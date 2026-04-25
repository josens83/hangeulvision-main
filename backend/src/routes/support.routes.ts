import { Router } from "express";
import * as c from "../controllers/support.controller";
import { authOptional, authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const supportRouter = Router();

supportRouter.post("/ticket", authOptional, asyncHandler(c.createTicket));
supportRouter.get("/tickets", authRequired, asyncHandler(c.myTickets));
supportRouter.get("/tickets/:id", authRequired, asyncHandler(c.ticketDetail));
