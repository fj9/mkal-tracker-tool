import { describe, expect, it } from "vitest";
import { MKAL_LINKS } from "./mkalLinks";

describe("MKAL_LINKS", () => {
  it("are all https links", () => {
    for (const url of Object.values(MKAL_LINKS)) expect(url).toMatch(/^https:\/\//);
  });
});
