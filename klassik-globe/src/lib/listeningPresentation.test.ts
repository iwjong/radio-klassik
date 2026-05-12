import { describe, expect, it } from "vitest";
import { getListeningPresentation } from "./listeningPresentation";
import type { Station } from "./types";

describe("listening presentation", () => {
  it("keeps the empty state intentional and calm", () => {
    expect(getListeningPresentation(null, "idle")).toMatchObject({
      stateLabel: "Nothing playing",
      title: "Choose a station and let the room settle",
      subtitle: "A quiet world map of curated classical stations is ready.",
    });
  });

  it("uses curated station atmosphere before technical details", () => {
    expect(
      getListeningPresentation(stationFixture(), "playing", "France"),
    ).toMatchObject({
      stateLabel: "Live",
      title: "France Musique",
      subtitle: "Late-night Paris orchestral programming · Verified",
      detail: "Elegant, reflective, and editorial.",
    });
  });

  it("names paused and blocked streams without sounding broken", () => {
    expect(getListeningPresentation(stationFixture(), "paused").detail).toBe(
      "Playback is held in a quiet listening state",
    );

    expect(
      getListeningPresentation(
        { ...stationFixture(), isSecureStream: false },
        "error",
      ),
    ).toMatchObject({
      stateLabel: "Legacy stream blocked",
      detail: "This HTTP stream may be blocked on secure deployments.",
    });
  });
});

function stationFixture(): Station {
  return {
    id: "france-musique",
    name: "France Musique",
    url: "https://example.com/stream.mp3",
    homepage: "",
    favicon: "",
    country: "France",
    countryCode: "FR",
    state: "",
    language: "french",
    tags: ["classical"],
    codec: "AAC",
    bitrate: 192,
    votes: 1200,
    clickCount: 20,
    lat: 48.85,
    lng: 2.35,
    isSecureStream: true,
    curationScore: 12,
    verified: true,
    editorialDescription: "Late-night Paris orchestral programming",
    listeningMood: "Elegant, reflective, and editorial.",
    regionDescription: "A Parisian public-radio stage.",
  };
}
