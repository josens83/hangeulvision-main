import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middleware/error.middleware";
import { rateLimiter } from "./middleware/rateLimiter.middleware";
import { prisma } from "./prisma";
import { achievementRouter } from "./routes/achievement.routes";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { bookmarkRouter } from "./routes/bookmark.routes";
import { goalsRouter } from "./routes/goals.routes";
import { internalRouter } from "./routes/internal.routes";
import { learningRouter } from "./routes/learning.routes";
import { packageRouter } from "./routes/package.routes";
import { paddleRouter } from "./routes/paddle.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { progressRouter } from "./routes/progress.routes";
import { quizRouter } from "./routes/quiz.routes";
import { subscriptionRouter } from "./routes/subscription.routes";
import { userRouter } from "./routes/user.routes";
import { wordRouter } from "./routes/word.routes";
import { logger } from "./utils/logger";

function createApp() {
  const app = express();

  // ─── Security + Performance (before everything) ─────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    }),
  );
  app.use(rateLimiter);

  // ─── CORS ───────────────────────────────────────────────
  const ALLOWED_ORIGINS: string[] = [
    "https://hangeulvision-main.vercel.app",
    "https://hangeulvision.app",
    "http://localhost:3000",
    process.env.CORS_ORIGIN ?? "",
    ...config.corsOrigins,
  ]
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
          return cb(null, true);
        }
        logger.warn(`CORS blocked origin: ${origin}`);
        return cb(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Key"],
    }),
  );

  // ─── Body parsers + logging ─────────────────────────────
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.env === "production" ? "combined" : "dev"));

  // ─── Health ─────────────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({
      service: "hangeulvision-backend",
      version: "0.2.0",
      status: "ok",
      env: config.env,
    });
  });
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "hangeulvision" });
  });
  app.get("/ready", (_req, res) => {
    res.json({ status: "ready" });
  });

  // ─── Routes ─────────────────────────────────────────────
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/achievements", achievementRouter);
  app.use("/bookmarks", bookmarkRouter);
  app.use("/goals", goalsRouter);
  app.use("/words", wordRouter);
  app.use("/learning", learningRouter);
  app.use("/progress", progressRouter);
  app.use("/quiz", quizRouter);
  app.use("/packages", packageRouter);
  app.use("/subscription", subscriptionRouter);
  app.use("/payments", paymentsRouter);
  app.use("/paddle", paddleRouter);
  app.use("/admin", adminRouter);
  app.use("/internal", internalRouter);

  // ─── 404 + error ────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found", message: "Route not found" });
  });
  app.use(errorHandler);

  return app;
}

export const app = createApp();

// ─── Server + graceful shutdown ─────────────────────────────────────────────

const port = Number(process.env.PORT ?? 8080);
const server = app.listen(port, "0.0.0.0", () => {
  logger.info(`🚀 HangeulVision API running on port ${port}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server closed, DB disconnected");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});
