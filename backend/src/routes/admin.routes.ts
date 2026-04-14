import { Router } from "express";
import * as c from "../controllers/admin.controller";
import { authRequired, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

export const adminRouter = Router();

adminRouter.use(authRequired, requireRole("admin", "editor"));

// Dashboards
adminRouter.get("/stats", asyncHandler(c.stats));
adminRouter.get("/content-inventory", asyncHandler(c.contentInventory));

// Users
adminRouter.get("/users", asyncHandler(c.listUsers));
adminRouter.get("/users/:id", asyncHandler(c.getUser));
adminRouter.patch("/users/:id", asyncHandler(c.updateUser));
adminRouter.delete("/users/:id", asyncHandler(c.deleteUser));

// Words CRUD
adminRouter.get("/words", asyncHandler(c.listWords));
adminRouter.post("/words", asyncHandler(c.createWord));
adminRouter.get("/words/:id", asyncHandler(c.getWord));
adminRouter.put("/words/:id", asyncHandler(c.updateWord));
adminRouter.delete("/words/:id", asyncHandler(c.deleteWord));

// Image queue / QA
adminRouter.get("/image-queue", asyncHandler(c.imageQueue));
adminRouter.post("/image-queue/:id/retry", asyncHandler(c.retryImage));

// Payments audit
adminRouter.get("/payments", asyncHandler(c.listPayments));
