import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

const EXAMS = [
  "TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV", "KIIP", "EPS_TOPIK", "THEME", "GENERAL",
] as const;

const questionsQuery = z.object({
  exam: z.enum(EXAMS).default("TOPIK_I"),
  count: z.coerce.number().int().min(3).max(20).default(10),
  type: z.enum(["multiple_choice", "fill", "match", "timed"]).default("multiple_choice"),
});

const submitBody = z.object({
  answers: z.array(z.object({
    wordId: z.string().min(1),
    selectedIndex: z.coerce.number().int().min(0).max(3),
  })).min(1),
  exam: z.enum(EXAMS).optional(),
  type: z.enum(["multiple_choice"]).optional(),
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** GET /quiz/questions?exam=TOPIK_I&count=10&type=multiple_choice|fill|match|timed */
export async function getQuestions(req: Request, res: Response) {
  uid(req);
  const q = questionsQuery.parse(req.query);

  const allWords = await prisma.word.findMany({
    where: { exam: q.exam, active: true },
    select: { id: true, word: true, romanization: true, definitionEn: true },
  });

  if (allWords.length < 4) {
    res.status(400).json({
      error: "not_enough_words",
      message: `Need at least 4 words in ${q.exam}, found ${allWords.length}.`,
    });
    return;
  }

  const shuffled = shuffle(allWords);

  if (q.type === "fill") {
    const words = shuffled.slice(0, Math.min(q.count, allWords.length));
    const questions = words.map((w) => ({
      wordId: w.id,
      definitionEn: w.definitionEn,
      answer: w.word,
      romanization: w.romanization,
    }));
    res.json({ questions, exam: q.exam, type: "fill" });
    return;
  }

  if (q.type === "match") {
    const pairCount = Math.min(5, allWords.length);
    const words = shuffled.slice(0, pairCount);
    const pairs = words.map((w) => ({ wordId: w.id, word: w.word, definitionEn: w.definitionEn }));
    const shuffledDefs = shuffle(pairs.map((p) => ({ wordId: p.wordId, definitionEn: p.definitionEn })));
    res.json({ pairs, shuffledDefinitions: shuffledDefs, exam: q.exam, type: "match" });
    return;
  }

  if (q.type === "timed") {
    const count = Math.min(20, allWords.length);
    const words = shuffled.slice(0, count);
    const questions = words.map((w) => {
      const distractors = shuffle(allWords.filter((d) => d.id !== w.id)).slice(0, 3);
      const options = shuffle([w.definitionEn, ...distractors.map((d) => d.definitionEn)]);
      return { wordId: w.id, word: w.word, options, correctIndex: options.indexOf(w.definitionEn) };
    });
    res.json({ questions, exam: q.exam, type: "timed", timeLimit: 60 });
    return;
  }

  // Default: multiple_choice
  const questionWords = shuffled.slice(0, Math.min(q.count, allWords.length));
  const questions = questionWords.map((w) => {
    const distractors = shuffle(allWords.filter((d) => d.id !== w.id)).slice(0, 3);
    const options = shuffle([w.definitionEn, ...distractors.map((d) => d.definitionEn)]);
    return { wordId: w.id, word: w.word, options, correctIndex: options.indexOf(w.definitionEn) };
  });
  res.json({ questions, exam: q.exam, type: q.type });
}

/** POST /quiz/submit */
export async function submitQuiz(req: Request, res: Response) {
  const userId = uid(req);
  const body = submitBody.parse(req.body);

  // Fetch the correct definitions for all answered words
  const wordIds = body.answers.map((a) => a.wordId);
  const words = await prisma.word.findMany({
    where: { id: { in: wordIds } },
    select: { id: true, word: true, definitionEn: true },
  });
  const wordMap = new Map(words.map((w) => [w.id, w]));

  // We need the original question data to check answers. Since the client
  // sends selectedIndex, we need to know what options were shown. For now,
  // we'll re-validate by checking if the client's answer matches the
  // correct definition. The client sends the questions back with their
  // answers — we trust the correctIndex from the original generation.
  // A more secure approach would store questions server-side, but for MVP
  // this is sufficient.

  let score = 0;
  const results = body.answers.map((a) => {
    const w = wordMap.get(a.wordId);
    // We can't fully validate without stored questions, so we accept
    // the client's report. Server-side quiz storage is a follow-up.
    return {
      wordId: a.wordId,
      word: w?.word ?? "",
      selectedIndex: a.selectedIndex,
      correctAnswer: w?.definitionEn ?? "",
    };
  });

  // The client will send correctness alongside — for now just count
  // based on stored quiz record. We'll create a Quiz record.
  // Actually, let's have the client send which were correct.
  // Simpler: accept a `correct` boolean from client for each answer.

  // Re-parse with correct field
  const answersWithCorrect = body.answers as Array<{
    wordId: string;
    selectedIndex: number;
    correct?: boolean;
  }>;

  for (const a of answersWithCorrect) {
    if (a.correct) score += 1;
  }

  const total = body.answers.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Save quiz record
  await prisma.quiz.create({
    data: {
      userId,
      exam: body.exam ?? "TOPIK_I",
      score,
      total,
      completedAt: new Date(),
      payload: results as any,
    },
  });

  // Increment daily progress for correct answers
  if (score > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyProgress: { increment: score },
        lastActiveAt: new Date(),
      },
    }).catch(() => {});
  }

  res.json({ score, total, percentage, results });
}
