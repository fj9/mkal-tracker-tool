import { describe, expect, it } from "vitest";
import { GOATCOUNTER_CODE, countUrl, pathFromHash } from "./analytics";

describe("analytics helpers", () => {
  it("builds the GoatCounter endpoint from a site code", () => {
    expect(countUrl("freyadknot")).toBe("https://freyadknot.goatcounter.com/count");
  });
  it("turns a hash route into a path", () => {
    expect(pathFromHash("#/clue/abc/knit")).toBe("/clue/abc/knit");
    expect(pathFromHash("")).toBe("/");
    expect(pathFromHash("#")).toBe("/");
  });
  it("is off until a site code is set", () => {
    expect(typeof GOATCOUNTER_CODE).toBe("string");
  });
});
