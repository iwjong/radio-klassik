import { describe, expect, it } from "vitest";
import { getFocusModeViewState } from "./focusMode";

describe("focus mode view state", () => {
  it("stays visually neutral until a station is active", () => {
    const state = getFocusModeViewState(true, false);

    expect(state.rootClassName).toBe("");
    expect(state.topBarClassName).toContain("opacity-100");
  });

  it("dims non-essential UI when listening focus is active", () => {
    const state = getFocusModeViewState(true, true);

    expect(state.rootClassName).toBe("is-focus-mode");
    expect(state.topBarClassName).toContain("opacity-[0.14]");
    expect(state.mapClassName).toContain("opacity-[0.38]");
    expect(state.playerClassName).toContain("pb-12");
  });

  it("keeps focus transitions reduced-motion friendly", () => {
    const state = getFocusModeViewState(true, true);

    expect(state.topBarClassName).toContain("motion-reduce:transition-none");
    expect(state.mapClassName).toContain("motion-reduce:transition-none");
    expect(state.playerClassName).toContain("motion-reduce:transition-none");
  });
});
