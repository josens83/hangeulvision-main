/**
 * internal.controller.ts
 * ──────────────────────
 * Content pipeline hooks. Protected by the X-Internal-Key middleware on
 * `internal.routes.ts` — never call these from the public surface.
 *
 * Live endpoints:
 *   POST /internal/generate-words        — one batch (size in body)
 *   POST /internal/generate-words-batch  — loop many batches toward a target
 *   POST /internal/generate-content-continuous  (alias of batch, preserved
 *                                                for VocaVision-parity tooling)
 *   POST /internal/generate-content             (alias of single batch)
 *
 * Image endpoints:
 *   GET  /internal/generate-images         — concept images for words missing them
 *   POST /internal/generate-concept        (stub → single image, TBD)
 */

import Anthropic from "@anthropic-ai/sdk";
import type { OriginLanguage, PartOfSpeech, Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import {
  generateWordsWithClaude,
  hasClaudeCredentials,
  type GeneratedEtymology,
  type GeneratedWord,
} from "../services/claude.service";
import {
  generateAndUploadConceptImage,
  hasStabilityCredentials,
  hasSupabaseStorage,
} from "../services/image.service";
import { badRequest } from "../utils/http";
import { stub } from "./_stub";

// ─── Validation ────────────────────────────────────────────────────────────

const EXAM_VALUES = [
  "TOPIK_I",
  "TOPIK_II_MID",
  "TOPIK_II_ADV",
  "KIIP",
  "EPS_TOPIK",
  "THEME",
  "GENERAL",
] as const;

const generateWordsSchema = z.object({
  exam: z.enum(EXAM_VALUES).default("TOPIK_I"),
  // Accept either string ("1") or number (1) — the user's spec sends strings.
  level: z.union([z.string(), z.number()]).transform((v) => Number(v)).pipe(
    z.number().int().min(1).max(6),
  ),
  count: z.coerce.number().int().min(1).max(20).default(10),
  category: z.string().trim().max(50).optional(),
});

const generateBatchSchema = z.object({
  exam: z.enum(EXAM_VALUES).default("TOPIK_I"),
  level: z.union([z.string(), z.number()]).transform((v) => Number(v)).pipe(
    z.number().int().min(1).max(6),
  ),
  batchSize: z.coerce.number().int().min(1).max(20).default(10),
  totalTarget: z.coerce.number().int().min(1).max(200).default(50),
  category: z.string().trim().max(50).optional(),
});

// ─── Mapping helpers ───────────────────────────────────────────────────────

function mapPartOfSpeech(raw: string | undefined): PartOfSpeech {
  switch ((raw ?? "").toLowerCase()) {
    case "noun":
      return "NOUN";
    case "verb":
      return "VERB";
    case "adjective":
    case "adj":
      return "ADJ";
    case "adverb":
    case "adv":
      return "ADV";
    default:
      return "OTHER";
  }
}

function mapEtymologyLanguage(t: GeneratedEtymology["type"] | undefined): OriginLanguage {
  switch (t) {
    case "sino-korean":
      return "SINO_KOREAN";
    case "native":
      return "NATIVE";
    case "loanword":
      return "LOANWORD";
    default:
      return "UNKNOWN";
  }
}

function buildTags(
  category: string | undefined,
  tier: "basic" | "premium" = "basic",
): string[] {
  const out = new Set<string>([`tier:${tier}`, "source:claude"]);
  if (category) out.add(`category:${category.trim().toLowerCase()}`);
  return [...out];
}

/**
 * Builds the nested-create Prisma payload for one generated word.
 * Returns `null` for invalid entries (missing required fields) so the caller
 * can skip them without aborting the whole batch.
 */
function toCreatePayload(
  g: GeneratedWord,
  exam: (typeof EXAM_VALUES)[number],
  level: number,
  category: string | undefined,
): Prisma.WordCreateInput | null {
  if (!g.word || !g.pronunciation || !g.definitionEn) return null;

  const tags = buildTags(category ?? g.category);
  const partOfSpeech = mapPartOfSpeech(g.partOfSpeech);

  const data: Prisma.WordCreateInput = {
    word: g.word.trim(),
    romanization: g.pronunciation.trim(),
    definitionEn: g.definitionEn.trim(),
    partOfSpeech,
    level,
    exam,
    tags,
    active: true,
  };

  // Etymology — 1:1, nested-create
  if (g.etymology) {
    const e = g.etymology;
    const origin =
      e.type === "sino-korean"
        ? (e.hanja ?? e.origin ?? g.word)
        : (e.origin ?? g.word);
    data.etymology = {
      create: {
        origin,
        language: mapEtymologyLanguage(e.type),
        rootWords: (e.components ?? []) as unknown as Prisma.InputJsonValue,
      },
    };
  }

  // Mnemonic — 1:1, nested-create
  if (g.mnemonic && g.mnemonic.trim()) {
    data.mnemonic = {
      create: { englishHint: g.mnemonic.trim(), syllables: [] },
    };
  }

  // Examples — position-ordered
  if (Array.isArray(g.examples) && g.examples.length) {
    data.examples = {
      create: g.examples.map((ex, i) => ({
        position: i,
        sentence: ex.korean,
        translation: ex.english,
      })),
    };
  }

  // Collocations — user spec has strings; store with empty translation.
  if (Array.isArray(g.collocations) && g.collocations.length) {
    data.collocations = {
      create: g.collocations
        .filter((c) => typeof c === "string" && c.trim().length > 0)
        .map((phrase) => ({ phrase: phrase.trim(), translation: "" })),
    };
  }

  return data;
}

// ─── Core batch runner ─────────────────────────────────────────────────────

interface BatchReport {
  created: number;
  skipped: number;
  errors: Array<{ word?: string; error: string }>;
  words: Array<{ id: string; word: string; partOfSpeech: string }>;
  usage: { input: number; output: number; cacheRead: number };
  /** Per-word disposition log, useful for debugging skip/error counts. */
  log: Array<{ word: string; status: "created" | "skipped" | "error"; reason?: string }>;
}

/**
 * Normalises a Korean word for dedup comparisons.
 *   • Trim leading/trailing whitespace.
 *   • NFC normalise — Claude and the database can disagree on whether
 *     `한` is the precomposed syllable U+D55C or the decomposed sequence
 *     ᄒ + ᅡ + ᆫ. NFC collapses both to the same byte sequence.
 *   • Strip the special "·" middle dot some classical-style entries
 *     emit between syllables (we never want it in storage).
 */
function normalizeWord(w: string): string {
  return w.normalize("NFC").trim().replace(/·/g, "");
}

async function runOneBatch(
  exam: (typeof EXAM_VALUES)[number],
  level: number,
  count: number,
  category: string | undefined,
): Promise<BatchReport> {
  // ─── existing-words fetch ────────────────────────────────────────────────
  // Pull every active word in this exam so the model has a "do not repeat"
  // list AND so we can dedupe its responses in O(1) afterwards.
  // Take 1000 — Word table tops out around 13K when fully populated, and the
  // dictionary basics we need to block (밥, 물, 학교, …) are always within
  // the lowest few hundred. Prompt-side slicing inside the service still
  // caps at 400 to protect the prefix cache.
  const existingRows = await prisma.word.findMany({
    where: { exam, active: true },
    select: { word: true },
    take: 1000,
  });
  const existingWords = existingRows.map((r) => r.word);
  const existingSet = new Set(existingWords.map(normalizeWord));

  // eslint-disable-next-line no-console
  console.log(
    `[generate-words] exam=${exam} level=${level} count=${count} category=${category ?? "-"}` +
      ` · existingFetched=${existingWords.length} sentToClaude=${Math.min(existingWords.length, 400)}` +
      ` · sample=[${existingWords.slice(0, 8).join(", ")}${existingWords.length > 8 ? ", …" : ""}]`,
  );

  const gen = await generateWordsWithClaude({
    exam,
    level: String(level),
    count,
    category,
    existingWords,
  });

  // eslint-disable-next-line no-console
  console.log(
    `[generate-words] claude returned ${gen.words.length} words ` +
      `· tokens in=${gen.usage.input} out=${gen.usage.output} cacheRead=${gen.usage.cacheRead}` +
      ` · returned=[${gen.words.map((w) => w.word).join(", ")}]`,
  );

  const created: BatchReport["words"] = [];
  const errors: BatchReport["errors"] = [];
  const log: BatchReport["log"] = [];
  let skipped = 0;

  // Track words created during *this* batch so a duplicate within the
  // Claude response itself (rare but possible) gets caught before we hit
  // the database.
  const createdThisBatch = new Set<string>();

  for (const g of gen.words) {
    if (!g.word || typeof g.word !== "string") {
      errors.push({ error: "missing_word_field" });
      log.push({ word: String(g.word ?? ""), status: "error", reason: "missing_word_field" });
      continue;
    }

    const norm = normalizeWord(g.word);

    // (a) intra-batch dup
    if (createdThisBatch.has(norm)) {
      skipped += 1;
      log.push({ word: g.word, status: "skipped", reason: "duplicate_in_response" });
      continue;
    }

    // (b) dictionary dup — fast in-memory Set lookup, no extra query
    if (existingSet.has(norm)) {
      skipped += 1;
      log.push({ word: g.word, status: "skipped", reason: "already_in_db" });
      continue;
    }

    const payload = toCreatePayload(g, exam, level, category);
    if (!payload) {
      errors.push({ word: g.word, error: "missing_required_fields" });
      log.push({ word: g.word, status: "error", reason: "missing_required_fields" });
      continue;
    }
    payload.word = norm; // store the normalised form

    try {
      const record = await prisma.word.create({
        data: payload,
        select: { id: true, word: true, partOfSpeech: true },
      });
      created.push({
        id: record.id,
        word: record.word,
        partOfSpeech: record.partOfSpeech,
      });
      createdThisBatch.add(norm);
      existingSet.add(norm); // future loop iterations see this word as known
      log.push({ word: g.word, status: "created" });
    } catch (err) {
      // (c) DB-level unique violation — typically a race or a NFC mismatch
      // we didn't normalise. Treat as skipped, not error: the row exists,
      // we just lost the in-process race.
      if (
        err instanceof PrismaNS.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        skipped += 1;
        log.push({
          word: g.word,
          status: "skipped",
          reason: `unique_violation(${(err.meta?.target as string[])?.join(",") ?? "unknown"})`,
        });
        continue;
      }
      errors.push({
        word: g.word,
        error: err instanceof Error ? err.message : String(err),
      });
      log.push({
        word: g.word,
        status: "error",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[generate-words] result · created=${created.length} skipped=${skipped} errors=${errors.length}`,
  );

  return {
    created: created.length,
    skipped,
    errors,
    words: created,
    usage: gen.usage,
    log,
  };
}

function unavailable(res: Response, message = "Claude content pipeline unavailable."): void {
  res.status(501).json({
    error: "not_implemented",
    message,
    hint: "Set ANTHROPIC_API_KEY on the server to enable this endpoint.",
  });
}

function mapClaudeError(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      body: {
        error: "rate_limit",
        message: "Claude API rate limit hit — slow down and retry.",
      },
    };
  }
  if (err instanceof Anthropic.APIError) {
    return {
      status: err.status ?? 502,
      body: {
        error: "claude_api_error",
        status: err.status,
        message: err.message,
      },
    };
  }
  return {
    status: 500,
    body: {
      error: "internal_error",
      message: err instanceof Error ? err.message : String(err),
    },
  };
}

/**
 * Picks the input source for the two endpoints:
 *   • GET  → `req.query` (browser-paste pattern, `?key=…&exam=…&…`)
 *   • POST → `req.body`  (operator tools and CI scripts)
 * The `key` query param is stripped — it's only used by `internalOnly`.
 */
function inputFor(req: Request): Record<string, unknown> {
  if (req.method === "GET") {
    const q = { ...(req.query as Record<string, unknown>) };
    delete q.key;
    return q;
  }
  return (req.body as Record<string, unknown>) ?? {};
}

// ─── Endpoint: GET / POST /internal/generate-words ─────────────────────────

export async function generateWords(req: Request, res: Response): Promise<void> {
  if (!hasClaudeCredentials()) {
    unavailable(res);
    return;
  }

  let body: z.infer<typeof generateWordsSchema>;
  try {
    body = generateWordsSchema.parse(inputFor(req));
  } catch (err) {
    throw badRequest("Invalid request body.", err);
  }

  try {
    const report = await runOneBatch(body.exam, body.level, body.count, body.category);
    res.json({
      exam: body.exam,
      level: body.level,
      requested: body.count,
      ...report,
    });
  } catch (err) {
    const { status, body: payload } = mapClaudeError(err);
    res.status(status).json(payload);
  }
}

// ─── Endpoint: GET / POST /internal/generate-words-batch ───────────────────

export async function generateWordsBatch(req: Request, res: Response): Promise<void> {
  if (!hasClaudeCredentials()) {
    unavailable(res);
    return;
  }

  let body: z.infer<typeof generateBatchSchema>;
  try {
    body = generateBatchSchema.parse(inputFor(req));
  } catch (err) {
    throw badRequest("Invalid request body.", err);
  }

  const batches: Array<BatchReport & { batchIndex: number }> = [];
  let totalCreated = 0;
  let totalSkipped = 0;
  const aggregateErrors: BatchReport["errors"] = [];
  const aggregateUsage = { input: 0, output: 0, cacheRead: 0 };

  const maxBatches = Math.ceil(body.totalTarget / body.batchSize);

  for (let i = 0; i < maxBatches; i += 1) {
    const remaining = body.totalTarget - totalCreated;
    if (remaining <= 0) break;
    const batchCount = Math.min(body.batchSize, remaining);

    try {
      const report = await runOneBatch(
        body.exam,
        body.level,
        batchCount,
        body.category,
      );
      batches.push({ ...report, batchIndex: i });
      totalCreated += report.created;
      totalSkipped += report.skipped;
      aggregateErrors.push(...report.errors);
      aggregateUsage.input += report.usage.input;
      aggregateUsage.output += report.usage.output;
      aggregateUsage.cacheRead += report.usage.cacheRead;
    } catch (err) {
      const { status, body: payload } = mapClaudeError(err);
      aggregateErrors.push({
        error: `batch ${i} failed: ${JSON.stringify({ status, ...payload })}`,
      });
      // On rate limit, stop early rather than hammer the API.
      if (err instanceof Anthropic.RateLimitError) break;
    }

    // 1-second pause between batches, per spec, except after the last one.
    if (i < maxBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  res.json({
    exam: body.exam,
    level: body.level,
    totalTarget: body.totalTarget,
    totalCreated,
    totalSkipped,
    batches: batches.length,
    errors: aggregateErrors,
    usage: aggregateUsage,
    detail: batches,
  });
}

// ─── Endpoint: GET / POST /internal/generate-images ────────────────────────

const generateImagesSchema = z.object({
  exam: z.enum(EXAM_VALUES).default("TOPIK_I"),
  count: z.coerce.number().int().min(1).max(20).default(10),
});

export async function generateImages(req: Request, res: Response): Promise<void> {
  if (!hasClaudeCredentials()) {
    unavailable(res, "Claude API key not configured (needed for prompt generation).");
    return;
  }
  if (!hasStabilityCredentials()) {
    unavailable(res, "Stability AI key not configured (STABILITY_API_KEY).");
    return;
  }
  if (!hasSupabaseStorage()) {
    unavailable(res, "Supabase Storage not configured (SUPABASE_URL + SUPABASE_SERVICE_KEY).");
    return;
  }

  let body: z.infer<typeof generateImagesSchema>;
  try {
    body = generateImagesSchema.parse(inputFor(req));
  } catch (err) {
    throw badRequest("Invalid request params.", err);
  }

  // Find words that don't have a CONCEPT visual yet.
  const words = await prisma.word.findMany({
    where: {
      exam: body.exam,
      active: true,
      visuals: { none: { kind: "CONCEPT" } },
    },
    select: { id: true, word: true, definitionEn: true },
    orderBy: [{ level: "asc" }, { word: "asc" }],
    take: body.count,
  });

  // eslint-disable-next-line no-console
  console.log(
    `[generate-images] exam=${body.exam} count=${body.count} ` +
      `eligible=${words.length} words=[${words.map((w) => w.word).join(", ")}]`,
  );

  if (words.length === 0) {
    res.json({
      message: "All words in this exam already have concept images.",
      created: 0,
      skipped: 0,
      errors: [],
    });
    return;
  }

  const results: Array<{ word: string; status: "created" | "skipped" | "error"; url?: string; error?: string }> = [];
  let created = 0;
  let skipped = 0;

  for (const w of words) {
    try {
      const result = await generateAndUploadConceptImage(
        w.id,
        w.word,
        w.definitionEn,
      );
      if (!result) {
        skipped += 1;
        results.push({ word: w.word, status: "skipped" });
        continue;
      }

      await prisma.wordVisual.create({
        data: {
          wordId: w.id,
          kind: "CONCEPT",
          url: result.url,
          prompt: result.prompt,
          width: 1024,
          height: 1024,
        },
      });
      created += 1;
      results.push({ word: w.word, status: "created", url: result.url });

      // eslint-disable-next-line no-console
      console.log(`[generate-images] ✓ ${w.word} → ${result.url}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ word: w.word, status: "error", error: msg });
      // eslint-disable-next-line no-console
      console.error(`[generate-images] ✗ ${w.word}:`, msg);
    }

    // Brief pause between images to respect rate limits.
    if (words.indexOf(w) < words.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[generate-images] done · created=${created} skipped=${skipped} errors=${results.filter((r) => r.status === "error").length}`,
  );

  res.json({ created, skipped, errors: results.filter((r) => r.status === "error"), results });
}

// ─── Legacy aliases (VocaVision parity) ────────────────────────────────────

export const generateContentContinuous = generateWordsBatch;
export const generateContent = generateWords;

// ─── Unchanged stubs ───────────────────────────────────────────────────────

export const generateConcept = stub("internal.generateConcept");
export const generateMnemonic = stub("internal.generateMnemonic");
export const generateRhyme = stub("internal.generateRhyme");
export const enqueue = stub("internal.enqueue");
export const pending = stub("internal.pending");
export const complete = stub("internal.complete");
export const fail = stub("internal.fail");
