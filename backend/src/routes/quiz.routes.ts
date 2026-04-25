import { Router } from "express";
import * as c from "../controllers/quiz.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const quizRouter = Router();

quizRouter.use(authRequired);

quizRouter.get("/questions", asyncHandler(c.getQuestions));
quizRouter.post("/submit", asyncHandler(c.submitQuiz));
quizRouter.get("/level-test", asyncHandler(c.levelTest));
quizRouter.post("/level-test/submit", asyncHandler(c.submitLevelTest));
