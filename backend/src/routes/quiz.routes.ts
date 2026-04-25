import { Router } from "express";
import * as c from "../controllers/quiz.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const quizRouter = Router();

quizRouter.use(authRequired);

quizRouter.get("/questions", asyncHandler(c.getQuestions));
quizRouter.post("/submit", asyncHandler(c.submitQuiz));
