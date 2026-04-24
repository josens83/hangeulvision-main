import { Router } from "express";
import * as c from "../controllers/user.controller";
import { authRequired } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const userRouter = Router();

userRouter.use(authRequired);

// Profile
userRouter.get("/me", asyncHandler(c.me));
userRouter.put("/me", asyncHandler(c.updateMe));
userRouter.patch("/me", asyncHandler(c.updateMe));
// Password + account
userRouter.put("/password", asyncHandler(c.changePassword));
userRouter.delete("/account", asyncHandler(c.deleteAccount));
userRouter.get("/me/stats", asyncHandler(c.myStats));
userRouter.get("/me/streak", asyncHandler(c.myStreak));
userRouter.post("/me/avatar", asyncHandler(c.uploadAvatar));
userRouter.post("/me/locale", asyncHandler(c.setLocale));

// Preferences (daily goal, reminder times, notification opt-in)
userRouter.get("/me/preferences", asyncHandler(c.getPreferences));
userRouter.patch("/me/preferences", asyncHandler(c.updatePreferences));

// Social / engagement surfaces
userRouter.get("/me/bookmarks", asyncHandler(c.listBookmarks));
userRouter.post("/me/bookmarks/:wordId", asyncHandler(c.addBookmark));
userRouter.delete("/me/bookmarks/:wordId", asyncHandler(c.removeBookmark));

userRouter.get("/me/collections", asyncHandler(c.listCollections));
userRouter.post("/me/collections", asyncHandler(c.createCollection));
userRouter.get("/me/decks", asyncHandler(c.listDecks));
userRouter.post("/me/decks", asyncHandler(c.createDeck));

userRouter.get("/me/achievements", asyncHandler(c.listAchievements));
userRouter.get("/me/notifications", asyncHandler(c.listNotifications));
userRouter.post("/me/notifications/:id/read", asyncHandler(c.markNotificationRead));

userRouter.get("/me/goals", asyncHandler(c.getGoals));
userRouter.put("/me/goals", asyncHandler(c.setGoals));

// Data export / account deletion (GDPR / K-PIPA)
userRouter.get("/me/export", asyncHandler(c.exportData));
userRouter.delete("/me", asyncHandler(c.deleteMe));
