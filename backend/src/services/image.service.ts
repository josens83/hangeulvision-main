/**
 * image.service.ts
 * ────────────────
 * Generates concept images for Korean vocabulary via:
 *   1. Claude          → visual prompt from word + definition
 *   2. Stability AI    → renders prompt to image (v1 JSON API)
 *   3. Supabase Storage → hosts the resulting PNG
 *
 * Uses the exact same Stability AI v1 endpoint and request format as
 * KanjiVision (which works). Previous attempts with the v2beta FormData
 * endpoint returned 401 despite a valid key — the v1 JSON endpoint
 * accepts the same key without issues.
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

// ─── Stability AI (v1 JSON API — same as KanjiVision) ──────────────────────

const STABILITY_URL =
  "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

function stabilityKey(): string {
  let raw = process.env.STABILITY_API_KEY ?? "";
  raw = raw.replace(/[\uFEFF\u200B\u200C\u200D]/g, "").trim();
  if (raw.toLowerCase().startsWith("bearer ")) {
    raw = raw.slice(7).trim();
  }
  return raw;
}

export function hasStabilityCredentials(): boolean {
  return stabilityKey().length > 0;
}

/**
 * Calls the Stability AI v1 text-to-image endpoint (JSON body, JSON response
 * with base64 artifacts). This is byte-for-byte the same request format that
 * KanjiVision uses successfully with the same API key.
 */
export async function generateImage(
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const key = stabilityKey();
  if (!key) {
    throw new ImagePipelineError("render", "stability_no_key");
  }

  // eslint-disable-next-line no-console
  console.log(
    `[image/stability] key: length=${key.length} prefix="${key.slice(0, 5)}…"`,
  );

  const res = await fetch(STABILITY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      text_prompts: [
        { text: prompt, weight: 1 },
        {
          text: "text, watermark, logo, signature, blurry, low quality, nsfw",
          weight: -1,
        },
      ],
      cfg_scale: 7,
      width: 1024,
      height: 1024,
      steps: 30,
      samples: 1,
    }),
  });

  // eslint-disable-next-line no-console
  console.log(
    `[image/stability] response: ${res.status} ${res.statusText}`,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const snippet = text.slice(0, 300).replace(/\s+/g, " ");
    // eslint-disable-next-line no-console
    console.error(`[image/stability] error: ${snippet}`);
    throw new ImagePipelineError(
      "render",
      `stability_${res.status}`,
      `Stability AI ${res.status}: ${snippet}`,
    );
  }

  const data = (await res.json()) as {
    artifacts?: Array<{ base64: string; finishReason: string }>;
  };

  if (!data.artifacts?.[0]?.base64) {
    throw new ImagePipelineError(
      "render",
      "stability_no_artifacts",
      "Stability returned success but no image artifacts.",
    );
  }

  return {
    buffer: Buffer.from(data.artifacts[0].base64, "base64"),
    contentType: "image/png",
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
