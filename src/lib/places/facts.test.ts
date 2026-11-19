import { describe, expect, it } from "vitest";
import { describeFacts, isInternational, needsAdapter, plugNote } from "./facts";

describe("destination facts", () => {
  it("describes a country", () => {
    expect(describeFacts("JP")).toBe("Same plugs as home · Japanese yen · Lots of places are cash only");
    expect(describeFacts("fr")).toBe("Type C/E plugs · euros");
    expect(describeFacts("US")).toBeNull();
    expect(describeFacts("ZZ")).toBeNull();
  });

  it("works out international trips and adapters", () => {
    expect(isInternational(["US", "US"])).toBe(false);
    expect(isInternational(["US", "JP"])).toBe(true);
    expect(needsAdapter(["JP", "US"])).toBe(false);
    expect(needsAdapter(["JP", "GB"])).toBe(true);
    expect(needsAdapter([undefined])).toBe(true);
    expect(plugNote(["FR", "GB"])).toBe("You'll need type C/E/G");
  });
});
