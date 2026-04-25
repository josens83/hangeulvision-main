import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    // Don't crash in dev — stubs need to run before Supabase exists.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env var: ${name}`);
    }
  }
  return v ?? "";
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8080),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Direct (non-pooled) connection used exclusively by `prisma migrate`.
  // Prisma CLI reads `DIRECT_URL` itself via the datasource block — this
  // field is just here so server code can surface it in diagnostics.
  directUrl: process.env.DIRECT_URL ?? "",
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      (process.env.NODE_ENV === "production"
        ? "https://hangeulvision-main-production.up.railway.app/auth/google/callback"
        : "http://localhost:8080/auth/google/callback"),
    frontendOrigin:
      process.env.FRONTEND_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://hangeulvision-main.vercel.app"
        : "http://localhost:3000"),
  },
  internalApiKey: process.env.INTERNAL_API_KEY ?? "",
  paddle: {
    vendorId: process.env.PADDLE_VENDOR_ID ?? "",
    apiKey: process.env.PADDLE_API_KEY ?? "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
    products: {
      basic: process.env.PADDLE_PRODUCT_BASIC ?? "",
      premium: process.env.PADDLE_PRODUCT_PREMIUM ?? "",
      topikIIMid: process.env.PADDLE_PRODUCT_TOPIK_II_MID ?? "",
      topikIIAdv: process.env.PADDLE_PRODUCT_TOPIK_II_ADV ?? "",
      eps: process.env.PADDLE_PRODUCT_EPS ?? "",
    },
  },
  toss: {
    clientKey: process.env.TOSS_CLIENT_KEY ?? "",
    secretKey: process.env.TOSS_SECRET_KEY ?? "",
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    bucket: process.env.SUPABASE_BUCKET_IMAGES ?? "hangeulvision-images",
  },
};
