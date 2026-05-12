import { useEffect, useRef, useState } from "react";
import {
  fetchNowPlayingMetadata,
  stationSupportsNowPlayingFetch,
  type NowPlayingMetadata,
} from "../lib/metadata";
import type { Station } from "../lib/types";

const METADATA_REFRESH_MS = 60_000;

export function useNowPlaying(station: Station | null): NowPlayingMetadata | null {
  const [metadataByStation, setMetadataByStation] = useState<
    Record<string, NowPlayingMetadata | undefined>
  >({});
  const cacheRef = useRef(new Map<string, NowPlayingMetadata>());
  const metadata = station ? metadataByStation[station.id] ?? null : null;

  useEffect(() => {
    if (!station || !stationSupportsNowPlayingFetch(station)) return;

    const controller = new AbortController();
    let active = true;
    const currentStation = station;

    async function refresh() {
      try {
        const next = await fetchNowPlayingMetadata(
          currentStation,
          controller.signal,
        );
        if (!active || !next) return;
        const previous = cacheRef.current.get(currentStation.id);
        if (previous?.raw === next.raw) return;
        cacheRef.current.set(currentStation.id, next);
        setMetadataByStation((current) => ({
          ...current,
          [currentStation.id]: next,
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    void refresh();
    const intervalId = window.setInterval(refresh, METADATA_REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [station]);

  return metadata;
}
