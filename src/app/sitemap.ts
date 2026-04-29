import type { MetadataRoute } from "next";
import { EXAMS } from "@/lib/exams";
import { SEED_WORDS } from "@/lib/words.seed";

const base = "https://hangeulvision-main.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "", "/exams", "/learn", "/review", "/pricing", "/signup", "/signin",
    "/install", "/quiz", "/bookmarks", "/statistics", "/achievements",
    "/league", "/decks", "/chat", "/study", "/courses", "/vocabulary",
    "/packages", "/faq", "/contact", "/cs", "/terms", "/privacy",
    "/refund-policy", "/announcements", "/collections",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "daily" as const : "weekly" as const,
    priority: p === "" ? 1 : p === "/pricing" ? 0.9 : 0.7,
  }));

  const examRoutes = EXAMS.map((e) => ({
    url: `${base}/exams/${e.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const wordRoutes = SEED_WORDS.map((w) => ({
    url: `${base}/learn/${w.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...examRoutes, ...wordRoutes];
}
