import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Station } from "../lib/types";

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error";

interface PersistedState {
  recent: string[];
  volume: number;
  showLegacyStreams: boolean;
  focusMode: boolean;
}

/** Live label for the selected station’s map marker (now-playing); not persisted. */
export interface MapLiveLabelState {
  stationId: string | null;
  /** Single-line summary (tooltip / fallback); not persisted. */
  line: string;
  /** When both are set with `line`, the active marker shows composer then work in two lines. */
  composerLine?: string | null;
  titleLine?: string | null;
}

interface State extends PersistedState {
  stations: Station[];
  loading: boolean;
  loadError: string | null;
  searchQuery: string;
  currentStationId: string | null;
  playbackStatus: PlaybackStatus;
  showLibrary: boolean;
  showInfo: boolean;
  showLegacyStreams: boolean;
  focusMode: boolean;
  mapLiveLabel: MapLiveLabelState;

  setStations: (stations: Station[]) => void;
  setLoadError: (msg: string | null) => void;
  setLoading: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  selectStation: (id: string | null) => void;
  setPlaybackStatus: (s: PlaybackStatus) => void;
  setMapLiveLabel: (v: MapLiveLabelState) => void;
  setVolume: (v: number) => void;
  setShowLegacyStreams: (v: boolean) => void;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
  pushRecent: (id: string) => void;
  toggleLibrary: () => void;
  setShowLibrary: (v: boolean) => void;
  toggleInfo: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      stations: [],
      loading: true,
      loadError: null,
      searchQuery: "",
      currentStationId: null,
      playbackStatus: "idle",
      showLibrary: false,
      showInfo: false,

      recent: [],
      volume: 0.8,
      showLegacyStreams: false,
      focusMode: false,
      mapLiveLabel: { stationId: null, line: "" },

      setStations: (stations) => set({ stations }),
      setLoadError: (msg) => set({ loadError: msg }),
      setLoading: (v) => set({ loading: v }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      selectStation: (id) => set({ currentStationId: id }),
      setPlaybackStatus: (s) => set({ playbackStatus: s }),
      setMapLiveLabel: (v) => set({ mapLiveLabel: v }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setShowLegacyStreams: (v) => set({ showLegacyStreams: v }),
      setFocusMode: (v) => set({ focusMode: v }),
      toggleFocusMode: () => set({ focusMode: !get().focusMode }),
      pushRecent: (id) => {
        const cur = get().recent.filter((x) => x !== id);
        set({ recent: [id, ...cur].slice(0, 30) });
      },
      toggleLibrary: () => set({ showLibrary: !get().showLibrary }),
      setShowLibrary: (v) => set({ showLibrary: v }),
      toggleInfo: () => set({ showInfo: !get().showInfo }),
    }),
    {
      name: "radio-klassik-v1",
      partialize: (s): PersistedState => ({
        recent: s.recent,
        volume: s.volume,
        showLegacyStreams: s.showLegacyStreams,
        focusMode: s.focusMode,
      }),
    },
  ),
);

export function useCurrentStation(): Station | null {
  return useStore((s) =>
    s.currentStationId
      ? s.stations.find((st) => st.id === s.currentStationId) ?? null
      : null,
  );
}
