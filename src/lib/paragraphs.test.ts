import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseParagraphs } from "./paragraphs";

describe("parseParagraphs", () => {
  it("splits paragraphs and pulls out links", () => {
    expect(parseParagraphs("One [a](https://x.test) two.\n\nThree.")).toEqual([
      [{ text: "One " }, { text: "a", href: "https://x.test" }, { text: " two." }],
      [{ text: "Three." }],
    ]);
  });
  it("the About copy links to Ravelry, Instagram, GitHub and Ko-fi", () => {
    const md = readFileSync(new URL("../../content/help/about.md", import.meta.url), "utf8");
    const hrefs = parseParagraphs(md).flat().flatMap((i) => (i.href ? [i.href] : []));
    expect(hrefs).toEqual([
      "https://www.ravelry.com/people/freyadknot",
      "https://www.instagram.com/freyaj9/",
      "https://github.com/fj9",
      "https://ko-fi.com/fjnine",
    ]);
  });
});
