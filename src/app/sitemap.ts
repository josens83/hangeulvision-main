import type { MetadataRoute } from "next";
import { EXAMS } from "@/lib/exams";
import { SEED_WORDS } from "@/lib/words.seed";

const base = "https://hangeulvision-main.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/exams", "/learn", "/review", "/pricing", "/signup", "/signin", "/install"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
  const examRoutes = EXAMS.map((e) => ({ url: `${base}/exams/${e.id}`, lastModified: new Date() }));
  const wordRoutes = SEED_WORDS.map((w) => ({ url: `${base}/learn/${w.id}`, lastModified: new Date() }));
  return [...staticRoutes, ...examRoutes, ...wordRoutes];
}
