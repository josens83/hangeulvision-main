// SuperMemo-2 (SM-2) spaced repetition — identical algorithm used by VocaVision.
import type { ProgressEntry } from "./types";

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export function initialProgress(wordId: string): ProgressEntry {
  return {
    wordId,
    ease: 2.5,
    interval: 0,
    reps: 0,
    dueAt: new Date().toISOString(),
  };
}

export function schedule(entry: ProgressEntry, grade: Grade): ProgressEntry {
  let { ease, interval, reps } = entry;
  if (grade < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  }
  const due = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  return {
    ...entry,
    ease,
    interval,
    reps,
    dueAt: due.toISOString(),
    lastGrade: grade,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function isDue(entry: ProgressEntry, at: Date = new Date()): boolean {
  return new Date(entry.dueAt).getTime() <= at.getTime();
}
