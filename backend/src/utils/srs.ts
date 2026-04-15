/**
 * SuperMemo-2 (SM-2) spaced repetition, server-side.
 * Mirrors the frontend algorithm in hangeulvision-main/src/lib/srs.ts so
 * client-optimistic updates always agree with the authoritative server
 * schedule.
 *
 * Grades (quality of recall):
 *   0 — blank out                     (reset)
 *   1 — incorrect, remembered after   (reset)
 *   2 — incorrect, seemed familiar    (reset)
 *   3 — correct but hard
 *   4 — correct with some hesitation
 *   5 — easy / instant recall
 */

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface SrsState {
  ease: number;       // ease factor, clamped to >= 1.3
  interval: number;   // days until the next review
  reps: number;       // consecutive successful reviews
  dueAt: Date;        // next due date (ISO'd at the API boundary)
}

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const DAY_MS = 86_400_000;

export function initialState(): SrsState {
  return { ease: DEFAULT_EASE, interval: 0, reps: 0, dueAt: new Date() };
}

/**
 * Produces the next SRS state for a review. Pure function — callers handle
 * persistence. Matches the frontend SM-2 implementation verbatim so the
 * server and the offline client always reach the same schedule.
 */
export function schedule(prev: SrsState, grade: Grade, now: Date = new Date()): SrsState {
  let { ease, interval, reps } = prev;

  if (grade < 3) {
    // Failure → restart the repetition ladder but keep accumulated ease.
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);

    ease = Math.max(
      MIN_EASE,
      ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
    );
  }

  return {
    ease,
    interval,
    reps,
    dueAt: new Date(now.getTime() + interval * DAY_MS),
  };
}

export function isDue(state: Pick<SrsState, "dueAt">, at: Date = new Date()): boolean {
  return state.dueAt.getTime() <= at.getTime();
}

/**
 * Mastery criterion shared by /progress/stats and admin dashboards.
 * A word is "mastered" when it has been recalled at ≥ grade 3 for 3+
 * consecutive reps *and* the ease factor hasn't dropped below default.
 */
export function isMastered(state: Pick<SrsState, "reps" | "ease">): boolean {
  return state.reps >= 3 && state.ease >= DEFAULT_EASE;
}
