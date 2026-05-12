import { describe, expect, it } from "vitest";
import { getFocusModeViewState } from "./focusMode";

describe("focus mode view state", () => {
  it("does not add a root dimming class (focus is zoom + layout only)", () => {
    const state = getFocusModeViewState(true, true);

    expect(state.rootClassName).toBe("");
    expect(state.mapClassName).toContain("opacity-100");
    expect(state.topBarClassName).toContain("opacity-100");
  });

  it("adds extra bottom padding for the player when focus is active", () => {
    const state = getFocusModeViewState(true, true);

    expect(state.playerClassName).toContain("pb-12");
  });

  it("keeps focus transitions reduced-motion friendly", () => {
    const state = getFocusModeViewState(true, true);

    expect(state.topBarClassName).toContain("motion-reduce:transition-none");
    expect(state.mapClassName).toContain("motion-reduce:transition-none");
    expect(state.playerClassName).toContain("motion-reduce:transition-none");
  });
});
