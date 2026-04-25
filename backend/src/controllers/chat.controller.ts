import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";
import { anthropicClient, hasClaudeCredentials } from "../services/claude.service";
import type Anthropic from "@anthropic-ai/sdk";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

const chatBody = z.object({
  message: z.string().min(1).max(2000),
  wordId: z.string().max(64).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(10).optional(),
});

const SYSTEM_PROMPT = `You are a friendly Korean language tutor for HangeulVision AI.
Your expertise: Korean vocabulary, grammar, pronunciation, hanja (한자) breakdown, and mnemonics.

Rules:
- Answer in English by default. Switch to Korean only when showing examples.
- When asked about a specific word, explain: meaning, part of speech, pronunciation tips, hanja origin (if Sino-Korean), common collocations, and a memory trick.
- Keep answers concise (under 200 words) unless the user asks for detail.
- Use markdown formatting: **bold** for Korean words, \`backticks\` for romanization.
- Be encouraging and supportive.`;

/** POST /chat */
export async function chat(req: Request, res: Response) {
  uid(req);

  if (!hasClaudeCredentials()) {
    res.status(501).json({ error: "not_configured", message: "AI chat requires ANTHROPIC_API_KEY." });
    return;
  }

  const body = chatBody.parse(req.body);
  const client = anthropicClient()!;

  // If wordId provided, fetch word context
  let wordContext = "";
  if (body.wordId) {
    const word = await prisma.word.findUnique({
      where: { id: body.wordId },
      include: { etymology: true, mnemonic: true, examples: { take: 2 } },
    });
    if (word) {
      wordContext = `\n\nContext — the user is studying this word:\nKorean: ${word.word}\nRomanization: ${word.romanization}\nDefinition: ${word.definitionEn}\nPart of speech: ${word.partOfSpeech}`;
      if (word.etymology) wordContext += `\nEtymology: ${word.etymology.origin} (${word.etymology.language})`;
      if (word.mnemonic) wordContext += `\nMnemonic: ${word.mnemonic.englishHint}`;
      if (word.examples.length) wordContext += `\nExample: ${word.examples[0].sentence} — ${word.examples[0].translation}`;
    }
  }

  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.message },
  ];

  try {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT + wordContext,
      messages,
    });

    const text = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    )?.text ?? "";

    const suggestions = [
      "How do I pronounce this?",
      "Show me more examples",
      "What's the hanja origin?",
      "Give me a memory trick",
    ];

    res.json({ content: text, suggestions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "ai_error", message: msg });
  }
}
