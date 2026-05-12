export interface FocusModeViewState {
  rootClassName: string;
  topBarClassName: string;
  mapClassName: string;
  playerClassName: string;
}

export function getFocusModeViewState(
  focusMode: boolean,
  hasStation: boolean,
): FocusModeViewState {
  const active = focusMode && hasStation;

  return {
    rootClassName: "",
    topBarClassName:
      "opacity-100 transition-opacity duration-700 motion-reduce:transition-none",
    mapClassName:
      "opacity-100 transition-opacity duration-1000 motion-reduce:transition-none",
    playerClassName: active
      ? "pb-12 transition-all duration-1000 motion-reduce:transition-none"
      : "pb-6 transition-all duration-700 motion-reduce:transition-none",
  };
}
