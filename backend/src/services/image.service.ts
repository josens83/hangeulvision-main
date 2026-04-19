/**
 * image.service.ts
 * ────────────────
 * Generates concept images for Korean vocabulary entries via:
 *   1. Claude   → derives a visual prompt from the word + definition
 *   2. Stability AI (sd3-large-turbo)  → renders the prompt to an image
 *   3. Supabase Storage → hosts the resulting webp
 *
 * Every function in this module returns `null` rather than throwing when
 * the relevant API key is missing — the controller counts those as
 * "skipped" and the pipeline degrades gracefully to text-only cards.
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { anthropicClient } from "./claude.service";

// ─── Stability AI ──────────────────────────────────────────────────────────

const STABILITY_URL =
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";
const STABILITY_KEY = () => process.env.STABILITY_API_KEY?.trim() ?? "";

export function hasStabilityCredentials(): boolean {
  return STABILITY_KEY().length > 0;
}

/**
 * Calls the Stability API (sd3-large-turbo, 1:1, webp output).
 * Returns the raw image buffer or null on failure.
 */
export async function generateImage(
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const key = STABILITY_KEY();
  if (!key) return null;

  const form = new FormData();
  form.append("prompt", prompt);
  form.append("model", "sd3-large-turbo");
  form.append("aspect_ratio", "1:1");
  form.append("output_format", "webp");

  const res = await fetch(STABILITY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "image/*" },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(
      `[image] Stability API ${res.status}: ${text.slice(0, 200)}`,
    );
    return null;
  }

  const arrayBuf = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    contentType: res.headers.get("content-type") ?? "image/webp",
  };
}

// ─── Supabase Storage ──────────────────────────────────────────────────────

export function hasSupabaseStorage(): boolean {
  return !!(config.supabase.url && config.supabase.serviceKey);
}

/**
 * Uploads a buffer to Supabase Storage and returns the public URL.
 * Path convention: `concept/{wordId}.webp`
 */
export async function uploadToSupabase(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  const { url, serviceKey, bucket } = config.supabase;
  if (!url || !serviceKey) return null;

  const endpoint = `${url}/storage/v1/object/${bucket}/${path}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      // Upsert so re-runs overwrite without error.
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(
      `[image] Supabase upload ${res.status}: ${text.slice(0, 200)}`,
    );
    return null;
  }

  // Public URL pattern for Supabase Storage.
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

// ─── Visual prompt generation (Claude) ─────────────────────────────────────

const PROMPT_SYSTEM = `You are a visual prompt engineer for vocabulary learning apps.
Given a Korean word and its English definition, produce a single visual prompt
for a concept illustration. The prompt must be:
- Under 80 words
- Describe a clear, simple scene that captures the word's meaning
- Specify "cute cartoon illustration" style
- Mention warm colors, educational feel, clean white background, no text
- No people's faces in detail (avoid likeness issues)
Return ONLY the prompt text, no quotes, no explanation.`;

/**
 * Asks Claude to write a short visual prompt for Stability AI.
 * Returns null when ANTHROPIC_API_KEY is unset.
 */
export async function generateVisualPrompt(
  word: string,
  definition: string,
): Promise<string | null> {
  const client = anthropicClient();
  if (!client) return null;

  try {
    const res = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: PROMPT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Korean word: ${word}\nEnglish definition: ${definition}`,
        },
      ],
    });

    const text = res.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    return text?.text?.trim() ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[image] Claude prompt generation failed:", err);
    return null;
  }
}

// ─── Full pipeline: prompt → image → upload ────────────────────────────────

export interface ImageResult {
  url: string;
  prompt: string;
}

/**
 * End-to-end: generates a visual prompt, renders it, and uploads to storage.
 * Returns null at any step failure (caller counts as "skipped").
 */
export async function generateAndUploadConceptImage(
  wordId: string,
  word: string,
  definition: string,
): Promise<ImageResult | null> {
  const prompt = await generateVisualPrompt(word, definition);
  if (!prompt) {
    // eslint-disable-next-line no-console
    console.warn(`[image] no prompt generated for ${word}`);
    return null;
  }

  const image = await generateImage(prompt);
  if (!image) return null;

  const path = `concept/${wordId}.webp`;

  if (hasSupabaseStorage()) {
    const url = await uploadToSupabase(path, image.buffer, image.contentType);
    if (url) return { url, prompt };
  }

  // Fallback: if Supabase isn't configured, we can't host the image.
  // eslint-disable-next-line no-console
  console.warn(
    `[image] Supabase Storage not configured — image generated but not uploaded for ${word}`,
  );
  return null;
}
