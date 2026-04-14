import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middleware/error.middleware";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { internalRouter } from "./routes/internal.routes";
import { learningRouter } from "./routes/learning.routes";
import { packageRouter } from "./routes/package.routes";
import { paddleRouter } from "./routes/paddle.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { progressRouter } from "./routes/progress.routes";
import { subscriptionRouter } from "./routes/subscription.routes";
import { userRouter } from "./routes/user.routes";
import { wordRouter } from "./routes/word.routes";

function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // curl / mobile apps
        if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.env === "production" ? "combined" : "dev"));

  // ─── Health ─────────────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({
      service: "hangeulvision-backend",
      version: "0.1.0",
      status: "ok",
      env: config.env,
    });
  });
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "hangeulvision" });
  });
  app.get("/ready", (_req, res) => {
    // TODO: ping Prisma once DATABASE_URL is configured.
    res.json({ status: "ready" });
  });

  // ─── Routes ─────────────────────────────────────────────
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/words", wordRouter);
  app.use("/learning", learningRouter);
  app.use("/progress", progressRouter);
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

// Always bind when this file is the entry point. Railway sets $PORT at runtime
// (we honor it); local / Docker default to 8080 to match VocaVision.
const port = Number(process.env.PORT ?? 8080);
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 HangeulVision API running on port ${port}`);
});
