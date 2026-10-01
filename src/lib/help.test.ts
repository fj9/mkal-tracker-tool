import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseHelp } from "./help";

describe("parseHelp", () => {
  it("splits headings and bodies", () => {
    expect(parseHelp("## A\n\nOne.\n\n## B\n\nTwo.\n")).toEqual([
      { title: "A", body: "One." },
      { title: "B", body: "Two." },
    ]);
  });
  it("the shipped help files give four welcome cards and a full FAQ", () => {
    const read = (n: string) => readFileSync(new URL(`../../content/help/${n}.md`, import.meta.url), "utf8");
    expect(parseHelp(read("welcome"))).toHaveLength(4);
    expect(parseHelp(read("faq")).length).toBeGreaterThanOrEqual(15);
  });
});
