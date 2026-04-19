/**
 * image.service.ts
 * ────────────────
 * Generates concept images for Korean vocabulary entries via:
 *   1. Claude          → derives a visual prompt from word + definition
 *   2. Stability AI    → renders the prompt to a 1024×1024 webp
 *   3. Supabase Storage → hosts the resulting webp
 *
 * Failure handling
 *   Each helper throws ImagePipelineError with a `step` + diagnostic
 *   `message`. The controller catches and surfaces that on the per-word
 *   result, so an operator can immediately see *why* a word was skipped:
 *     "claude_no_key", "stability_401", "supabase_404_bucket_not_found", etc.
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { anthropicClient } from "./claude.service";

export class ImagePipelineError extends Error {
  constructor(
    public readonly step: "prompt" | "render" | "upload",
    public readonly reason: string,
    message?: string,
  ) {
    super(message ?? `${step}:${reason}`);
  }
}

// ─── Stability AI ──────────────────────────────────────────────────────────

const STABILITY_URL =
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";
const STABILITY_KEY = () => process.env.STABILITY_API_KEY?.trim() ?? "";

export function hasStabilityCredentials(): boolean {
  return STABILITY_KEY().length > 0;
}

export async function generateImage(
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const key = STABILITY_KEY();
  if (!key) {
    throw new ImagePipelineError("render", "stability_no_key");
  }

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
    const snippet = text.slice(0, 160).replace(/\s+/g, " ");
    throw new ImagePipelineError(
      "render",
      `stability_${res.status}`,
      `Stability AI ${res.status}: ${snippet}`,
    );
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

export async function uploadToSupabase(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { url, serviceKey, bucket } = config.supabase;
  if (!url || !serviceKey) {
    throw new ImagePipelineError("upload", "supabase_no_credentials");
  }

  const endpoint = `${url}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const snippet = text.slice(0, 200).replace(/\s+/g, " ");
    // Surface common Supabase failure modes verbatim — bucket not found,
    // RLS policy denial, invalid service key, etc.
    throw new ImagePipelineError(
      "upload",
      `supabase_${res.status}`,
      `Supabase Storage ${res.status} on bucket "${bucket}": ${snippet}`,
    );
  }

  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

// ─── Claude prompt generation ──────────────────────────────────────────────

const PROMPT_SYSTEM = `You are a visual prompt engineer for vocabulary learning apps.
Given a Korean word and its English definition, produce a single visual prompt
for a concept illustration. The prompt must be:
- Under 80 words
- Describe a clear, simple scene that captures the word's meaning
- Specify "cute cartoon illustration" style
- Mention warm colors, educational feel, clean white background, no text
- No people's faces in detail (avoid likeness issues)
Return ONLY the prompt text, no quotes, no explanation.`;

export async function generateVisualPrompt(
  word: string,
  definition: string,
): Promise<string> {
  const client = anthropicClient();
  if (!client) {
    throw new ImagePipelineError("prompt", "claude_no_key");
  }

  let res;
  try {
    res = await client.messages.create({
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ImagePipelineError("prompt", "claude_api_error", msg);
  }

  const block = res.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const text = block?.text?.trim();
  if (!text) {
    throw new ImagePipelineError("prompt", "claude_empty_response");
  }
  return text;
}
