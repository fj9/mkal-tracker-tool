import { describe, expect, it } from "vitest";
import { backupReminderDue } from "./backup";

const day = 86_400_000;
const now = Date.parse("2026-10-20T12:00:00Z");
const ago = (d: number) => new Date(now - d * day).toISOString();

describe("backupReminderDue", () => {
  it("is not due before the app has ever been used", () => expect(backupReminderDue(undefined, undefined, now)).toBe(false));
  it("is not due in the first week", () => expect(backupReminderDue(ago(3), undefined, now)).toBe(false));
  it("is due after a week with no backup", () => expect(backupReminderDue(ago(8), undefined, now)).toBe(true));
  it("is not due when backed up recently", () => expect(backupReminderDue(ago(30), ago(2), now)).toBe(false));
  it("is due when the last backup is over a week old", () => expect(backupReminderDue(ago(30), ago(9), now)).toBe(true));
});
