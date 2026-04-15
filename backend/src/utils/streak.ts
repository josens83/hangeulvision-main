/**
 * Consecutive-day learning streak calculator.
 * Counts the longest run of days ending today (in server-local UTC) where
 * the user recorded any UserProgress review or completed a LearningSession.
 */
export function computeStreakDays(
  activityDates: Date[],
  now: Date = new Date(),
): number {
  if (activityDates.length === 0) return 0;

  // Bucket to midnight UTC keys so duplicates within a day collapse.
  const keys = new Set(activityDates.map((d) => dayKey(d)));
  let streak = 0;
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Allow the streak to start from today OR yesterday — it's fine if the
  // learner hasn't reviewed yet today as long as they did yesterday.
  if (!keys.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!keys.has(dayKey(cursor))) return 0;
  }

  while (keys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}
