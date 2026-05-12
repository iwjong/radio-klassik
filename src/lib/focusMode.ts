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
    rootClassName: active ? "is-focus-mode" : "",
    topBarClassName: active
      ? "opacity-[0.14] hover:opacity-95 focus-within:opacity-95 transition-opacity duration-1000 motion-reduce:transition-none"
      : "opacity-100 transition-opacity duration-700 motion-reduce:transition-none",
    mapClassName: active
      ? "opacity-[0.38] transition-opacity duration-1000 motion-reduce:transition-none"
      : "opacity-100 transition-opacity duration-1000 motion-reduce:transition-none",
    playerClassName: active
      ? "pb-12 transition-all duration-1000 motion-reduce:transition-none"
      : "pb-6 transition-all duration-700 motion-reduce:transition-none",
  };
}
