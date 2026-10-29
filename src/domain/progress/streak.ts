export function calculateCurrentStreak(activeDays: string[], today: string): number {
  const dates = new Set(activeDays);
  let cursor = new Date(`${today}T00:00:00.000Z`);
  const yesterday = new Date(cursor);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (!dates.has(today)) cursor = yesterday;
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
