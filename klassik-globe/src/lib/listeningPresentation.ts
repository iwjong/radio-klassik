import type { PlaybackStatus } from "../store/useStore";
import type { Station } from "./types";

export interface ListeningPresentation {
  stateLabel: string;
  title: string;
  subtitle: string;
  detail: string;
}

export function getListeningPresentation(
  station: Station | null,
  status: PlaybackStatus,
  countryLabel = "",
): ListeningPresentation {
  if (!station) {
    return {
      stateLabel: "Nothing playing",
      title: "Choose a station and let the room settle",
      subtitle: "A quiet world map of curated classical stations is ready.",
      detail: "Search or open the library when the listening room calls.",
    };
  }

  const subtitle =
    station.editorialDescription ||
    station.listeningMood ||
    countryLabel ||
    "Curated classical stream";

  return {
    stateLabel: playbackStateLabel(status, station),
    title: station.name,
    subtitle: station.verified ? `${subtitle} · Verified` : subtitle,
    detail: stationDetail(station, status),
  };
}

function playbackStateLabel(status: PlaybackStatus, station: Station): string {
  if (status === "loading") return "Tuning in";
  if (status === "playing") return "Live";
  if (status === "paused") return "Paused";
  if (status === "error") {
    return station.isSecureStream ? "Stream unavailable" : "Legacy stream blocked";
  }
  return "Ready";
}

function stationDetail(station: Station, status: PlaybackStatus): string {
  if (status === "loading") return "Opening a secure classical stream";
  if (status === "paused") return "Playback is held in a quiet listening state";
  if (status === "error") {
    return station.isSecureStream
      ? "The station did not answer cleanly; try another nearby stream."
      : "This HTTP stream may be blocked on secure deployments.";
  }

  return (
    station.listeningMood ||
    station.regionDescription ||
    station.atmosphereHint ||
    technicalDetail(station)
  );
}

function technicalDetail(station: Station): string {
  return [
    station.bitrate ? `${station.bitrate} kbps` : "",
    station.codec,
    station.isSecureStream ? "" : "Legacy HTTP",
  ]
    .filter(Boolean)
    .join(" · ");
}
