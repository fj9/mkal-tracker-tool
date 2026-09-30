const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** True after a week of use when there is no backup, or the last backup is over a week old. */
export function backupReminderDue(firstUsed: string | undefined, lastBackedUp: string | undefined, now = Date.now()): boolean {
  if (!firstUsed) return false;
  const first = Date.parse(firstUsed);
  if (Number.isNaN(first) || now - first < WEEK_MS) return false;
  if (!lastBackedUp) return true;
  const last = Date.parse(lastBackedUp);
  return Number.isNaN(last) || now - last >= WEEK_MS;
}
