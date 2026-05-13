import { describe, expect, it } from "vitest";
import { MUSIC_QUOTES } from "./musicQuotes";

describe("MUSIC_QUOTES", () => {
  it("has exactly 100 entries with unique text", () => {
    expect(MUSIC_QUOTES.length).toBe(100);
    const texts = new Set(MUSIC_QUOTES.map((q) => q.text));
    expect(texts.size).toBe(100);
  });
});
