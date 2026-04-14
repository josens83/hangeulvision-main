import { Router } from "express";
import * as c from "../controllers/auth.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const authRouter = Router();

// Email / password
authRouter.post("/signup", asyncHandler(c.signup));
authRouter.post("/login", asyncHandler(c.login));
authRouter.post("/logout", asyncHandler(c.logout));
authRouter.post("/refresh", asyncHandler(c.refresh));

// OAuth (Google)
authRouter.get("/google", asyncHandler(c.googleStart));
authRouter.get("/google/callback", asyncHandler(c.googleCallback));

// Current user
authRouter.get("/me", authRequired, asyncHandler(c.me));
authRouter.patch("/me", authRequired, asyncHandler(c.updateMe));
authRouter.post("/me/password", authRequired, asyncHandler(c.changePassword));
authRouter.delete("/me", authRequired, asyncHandler(c.deleteAccount));

// Email verification / password reset
authRouter.post("/verify/request", asyncHandler(c.requestVerification));
authRouter.post("/verify/confirm", asyncHandler(c.confirmVerification));
authRouter.post("/password/forgot", asyncHandler(c.forgotPassword));
authRouter.post("/password/reset", asyncHandler(c.resetPassword));
