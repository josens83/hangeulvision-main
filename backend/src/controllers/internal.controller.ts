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
 * Image endpoints and queue operations remain stubs until Stability AI
 * integration lands.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { OriginLanguage, PartOfSpeech, Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import {
  generateWordsWithClaude,
  hasClaudeCredentials,
  type GeneratedEtymology,
  type GeneratedWord,
} from "../services/claude.service";
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
}

async function runOneBatch(
  exam: (typeof EXAM_VALUES)[number],
  level: number,
  count: number,
  category: string | undefined,
): Promise<BatchReport> {
  // Pull the words already in the library so the model doesn't re-generate
  // dictionary basics. Cap the list — the prompt slices to 400 anyway.
  const existingRows = await prisma.word.findMany({
    where: { exam, active: true },
    select: { word: true },
    take: 500,
  });
  const existingWords = existingRows.map((r) => r.word);

  const gen = await generateWordsWithClaude({
    exam,
    level: String(level),
    count,
    category,
    existingWords,
  });

  const created: BatchReport["words"] = [];
  const errors: BatchReport["errors"] = [];
  let skipped = 0;

  for (const g of gen.words) {
    const payload = toCreatePayload(g, exam, level, category);
    if (!payload) {
      errors.push({ word: g.word, error: "missing_required_fields" });
      continue;
    }

    // Dedupe against the primary (word, partOfSpeech) uniqueness + the looser
    // "same Korean spelling" check the spec asked for.
    const dup = await prisma.word.findFirst({
      where: { word: payload.word },
      select: { id: true, partOfSpeech: true },
    });
    if (dup) {
      skipped += 1;
      continue;
    }

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
    } catch (err) {
      errors.push({
        word: payload.word,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    created: created.length,
    skipped,
    errors,
    words: created,
    usage: gen.usage,
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
