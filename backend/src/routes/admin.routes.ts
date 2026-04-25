import { Router } from "express";
import * as c from "../controllers/admin.controller";
import * as ac from "../controllers/announcement.controller";
import * as cc from "../controllers/collection.controller";
import * as sc from "../controllers/support.controller";
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

// Monitoring
adminRouter.get("/monitoring/health", asyncHandler(c.monitoringHealth));
adminRouter.post("/cache/clear", asyncHandler(c.cacheClear));

// Collections
adminRouter.post("/collections", asyncHandler(cc.adminCreate));
adminRouter.delete("/collections/:id", asyncHandler(cc.adminDelete));

// Announcements
adminRouter.post("/announcements", asyncHandler(ac.create));
adminRouter.delete("/announcements/:id", asyncHandler(ac.remove));

// Support tickets
adminRouter.get("/support/tickets", asyncHandler(sc.adminListTickets));
adminRouter.put("/support/tickets/:id", asyncHandler(sc.adminUpdateTicket));
