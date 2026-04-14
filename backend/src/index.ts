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
    res.json({ status: "ok", uptime: process.uptime() });
  });
  app.get("/ready", (_req, res) => {
    // TODO: ping Prisma once DATABASE_URL is configured.
    res.json({ status: "ready" });
  });

  // ─── Routes ─────────────────────────────────────────────
  app.use("/auth", authRouter);
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

if (require.main === module) {
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[hangeulvision] backend listening on :${config.port} (env=${config.env})`,
    );
  });
}
