/**
 * claude.service.ts
 * ─────────────────
 * Encapsulates the Anthropic Claude API calls the content pipeline uses to
 * generate Korean vocabulary entries for the HangeulVision library.
 *
 * Design
 *   • Lazy singleton client — instantiated only when ANTHROPIC_API_KEY is set,
 *     so routes cleanly fall back to stubs during local dev / CI.
 *   • Structured output via tool-use. Claude must call `register_korean_words`,
 *     which makes the returned JSON schema-validated rather than free-form
 *     (Sonnet 4 doesn't support the newer `output_config.format` surface).
 *   • Prompt caching on the system prompt block — the system text is stable
 *     across every request, so the 5-minute ephemeral cache pays for itself
 *     after the second batch.
 *   • Typed exceptions (Anthropic.RateLimitError, APIError) bubble up to the
 *     controller, which maps them to appropriate HTTP status codes.
 */

import Anthropic from "@anthropic-ai/sdk";

// The exact model the user asked for (legacy "Claude Sonnet 4" full ID).
// Change via env to upgrade without touching code.
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514";

// Null when the API key isn't set — callers check and fall back.
let _client: Anthropic | null | undefined;
export function anthropicClient(): Anthropic | null {
  if (_client !== undefined) return _client;
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  _client = key ? new Anthropic({ apiKey: key }) : null;
  return _client;
}

export function hasClaudeCredentials(): boolean {
  return anthropicClient() !== null;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type EtymologyType = "sino-korean" | "native" | "loanword";

export interface GeneratedComponent {
  char: string;
  meaning: string;
  reading: string;
}

export interface GeneratedEtymology {
  type: EtymologyType;
  origin?: string;
  hanja?: string;
  components?: GeneratedComponent[];
}

export interface GeneratedExample {
  korean: string;
  english: string;
}

export interface GeneratedWord {
  word: string;
  pronunciation: string;
  definitionEn: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | string;
  examples: GeneratedExample[];
  collocations?: string[];
  etymology?: GeneratedEtymology;
  mnemonic?: string;
  category?: string;
}

export interface GenerateWordsParams {
  exam: string;       // e.g. "TOPIK_I"
  level: string;      // e.g. "1"
  count: number;      // how many words to request
  category?: string;  // optional thematic bucket
  existingWords: string[];
}

// ─── Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Korean language expert creating TOPIK I vocabulary.
You generate high-quality dictionary entries with authentic Korean, accurate \
English definitions, natural example sentences, and (for Sino-Korean words) \
a precise hanja breakdown.

Rules:
- Every word must be real, standard modern Korean (no archaic, dialectal, or slang forms).
- Romanization follows the Revised Romanization of Korean (e.g. 한국 → hanguk).
- partOfSpeech must be one of: noun, verb, adjective, adverb.
- etymology.type must be one of: sino-korean, native, loanword.
  * sino-korean: include the hanja (Chinese-character) origin and component breakdown
    where each component has {char, meaning, reading}. Example component:
    {"char":"學","meaning":"study","reading":"학"}.
  * native: omit hanja/components, put a short description in "origin".
  * loanword: put the source language + original word in "origin" (e.g. "English: bus").
- Each example sentence must be natural, common, and tied to the target word.
- mnemonic is a short English syllable-breakdown memory hook (e.g.
  "KEOM-PYU-TEO — just say 'computer' with a Korean accent").
- category is one of: daily, food, transport, time, family, school, verb, adjective.
- Never repeat a word the caller told you to avoid.`;

// JSON Schema for the tool input. Keep it tight — Claude tends to hallucinate
// extra fields if the schema is too permissive.
const WORDS_TOOL = {
  name: "register_korean_words",
  description:
    "Register a batch of Korean vocabulary entries for the HangeulVision library.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["words"],
    properties: {
      words: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "word",
            "pronunciation",
            "definitionEn",
            "partOfSpeech",
            "examples",
          ],
          properties: {
            word: { type: "string" },
            pronunciation: { type: "string" },
            definitionEn: { type: "string" },
            partOfSpeech: {
              type: "string",
              enum: ["noun", "verb", "adjective", "adverb"],
            },
            examples: {
              type: "array",
              minItems: 2,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["korean", "english"],
                properties: {
                  korean: { type: "string" },
                  english: { type: "string" },
                },
              },
            },
            collocations: {
              type: "array",
              items: { type: "string" },
            },
            mnemonic: { type: "string" },
            category: { type: "string" },
            etymology: {
              type: "object",
              additionalProperties: false,
              required: ["type"],
              properties: {
                type: {
                  type: "string",
                  enum: ["sino-korean", "native", "loanword"],
                },
                origin: { type: "string" },
                hanja: { type: "string" },
                components: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["char", "meaning", "reading"],
                    properties: {
                      char: { type: "string" },
                      meaning: { type: "string" },
                      reading: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function buildUserPrompt(p: GenerateWordsParams): string {
  const categoryLine = p.category
    ? `\nCategory focus: ${p.category}.`
    : "\nMix categories (daily, food, transport, time, family, school, verbs, adjectives).";

  // Cap the existing-words list so the prompt doesn't blow past caching budget.
  // The first ~400 are enough signal — Claude won't generate dictionary basics
  // it has already seen.
  const existing = p.existingWords.slice(0, 400).join(", ");
  const existingLine = existing
    ? `\n\nDo NOT generate any of these words (already in database):\n${existing}`
    : "";

  return `Generate ${p.count} ${p.exam.replace("_", " ")} level ${p.level} Korean words.${categoryLine}

Use the register_korean_words tool exactly once, with a "words" array containing ${p.count} entries that follow the schema.${existingLine}`;
}

// ─── Main call ─────────────────────────────────────────────────────────────

export interface GenerationResult {
  words: GeneratedWord[];
  usage: { input: number; output: number; cacheRead: number };
  model: string;
}

export async function generateWordsWithClaude(
  params: GenerateWordsParams,
): Promise<GenerationResult> {
  const client = anthropicClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [WORDS_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: WORDS_TOOL.name },
    messages: [
      {
        role: "user",
        content: buildUserPrompt(params),
      },
    ],
  });

  // Because we forced tool_choice, Claude must emit a tool_use block with our
  // schema-matching payload. Pull it out.
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!block) {
    throw new Error("Claude did not emit a tool_use block — unexpected response shape.");
  }
  const parsed = block.input as { words?: GeneratedWord[] };
  if (!parsed || !Array.isArray(parsed.words)) {
    throw new Error("tool_use input did not contain a 'words' array.");
  }

  return {
    words: parsed.words,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cacheRead: response.usage.cache_read_input_tokens ?? 0,
    },
    model: MODEL,
  };
}
