import { afterEach, describe, expect, it, vi } from "vitest";
import type { RawStation } from "./types";
import {
  __resetRadioBrowserForTests,
  fetchClassicalStations,
  mapStation,
  RadioBrowserError,
} from "./radioBrowser";

const baseStation: RawStation = {
  changeuuid: "change-1",
  stationuuid: "station-1",
  name: "BBC Radio 3",
  url: "https://example.com/stream.mp3",
  url_resolved: "https://example.com/stream.mp3",
  homepage: "",
  favicon: "",
  tags: "classical",
  country: "United Kingdom",
  countrycode: "GB",
  state: "",
  language: "english",
  votes: 1200,
  codec: "MP3",
  bitrate: 128,
  hls: 0,
  lastcheckok: 1,
  clickcount: 10,
  clicktrend: 0,
  geo_lat: 51.5,
  geo_long: -0.12,
};

afterEach(() => {
  vi.unstubAllGlobals();
  __resetRadioBrowserForTests();
});

describe("classical curation filter", () => {
  it("keeps trusted classical stations and excludes contaminated genres", () => {
    expect(mapStation(baseStation)).toMatchObject({
      name: "BBC Radio 3",
      isSecureStream: true,
      verified: true,
      priorityScore: 9,
      editorialDescription:
        "British classical, new music, opera, and cultural conversation.",
      listeningMood: "Expansive late-evening orchestral listening.",
      atmosphereHint: "warm concert hall",
    });

    expect(
      mapStation({
        ...baseStation,
        stationuuid: "jazz-1",
        name: "Jazz Radio Classic Jazz",
        tags: "classical,jazz",
      }),
    ).toBeNull();

    expect(
      mapStation({
        ...baseStation,
        stationuuid: "generic-1",
        name: "Vivid Bharti",
        tags: "classical",
        votes: 15800,
      }),
    ).toBeNull();

    expect(
      mapStation({
        ...baseStation,
        stationuuid: "seo-1",
        name: "0R - BACH - CLASSICAL || Classical, Baroque, Orchestra, Piano, Strings, Chamber Music, Solo Instrument, Sacred, Symphonies, Concertos, Melodic, Calm, Relaxing, Instrumental, Elegant",
        tags: "bach,chamber,classical",
      }),
    ).toBeNull();

    expect(
      mapStation({
        ...baseStation,
        stationuuid: "holiday-1",
        name: "Christmas FM Classical & Carols",
        tags: "christmas,carols,classical",
      }),
    ).toBeNull();
  });

  it("prefers secure streams and hides legacy HTTP by default", () => {
    const legacy = {
      ...baseStation,
      stationuuid: "legacy-1",
      name: "Classical Radio",
      url: "http://example.com/stream.mp3",
      url_resolved: "http://example.com/stream.mp3",
    };

    expect(mapStation(legacy)).toBeNull();
    expect(mapStation(legacy, { includeLegacyStreams: true })).toMatchObject({
      isSecureStream: false,
    });
  });
});

describe("Radio Browser loading", () => {
  it("falls back through failed mirrors and dedupes stations", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes("all.api.radio-browser.info")) {
          return jsonResponse([
            { name: "bad.api.radio-browser.info" },
            { name: "good.api.radio-browser.info" },
          ]);
        }
        if (
          url.startsWith("https://de1.api.radio-browser.info") ||
          url.startsWith("https://bad.api.radio-browser.info")
        ) {
          throw new TypeError("getaddrinfo ENOTFOUND");
        }
        if (url.startsWith("https://good.api.radio-browser.info")) {
          return jsonResponse([
            baseStation,
            { ...baseStation, votes: 1800, bitrate: 256 },
          ]);
        }
        throw new Error(`Unexpected URL: ${url}`);
      }),
    );

    const stations = await fetchClassicalStations({ limit: 1, timeoutMs: 1000 });

    expect(stations).toHaveLength(1);
    expect(stations?.[0].votes).toBe(1800);
    expect(calls.some((url) => url.startsWith("https://good"))).toBe(true);
  });

  it("dedupes verified station variants by curated identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("all.api.radio-browser.info")) {
          return jsonResponse([{ name: "good.api.radio-browser.info" }]);
        }
        return jsonResponse([
          baseStation,
          {
            ...baseStation,
            stationuuid: "station-2",
            name: "BBC Radio 3 (AAC)",
            votes: 2400,
          },
        ]);
      }),
    );

    const stations = await fetchClassicalStations({ limit: 2, timeoutMs: 1000 });

    expect(stations).toHaveLength(1);
    expect(stations?.[0]).toMatchObject({
      name: "BBC Radio 3",
      votes: 2400,
      curatedStationId: "bbc-radio-3",
    });
  });

  it("returns a real empty result separately from a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("all.api.radio-browser.info")) {
          return jsonResponse([{ name: "good.api.radio-browser.info" }]);
        }
        return jsonResponse([]);
      }),
    );

    await expect(fetchClassicalStations({ timeoutMs: 1000 })).resolves.toEqual(
      [],
    );
  });

  it("throws a structured error when every mirror fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("all.api.radio-browser.info")) {
          return jsonResponse([{ name: "bad.api.radio-browser.info" }]);
        }
        throw new TypeError("Could not resolve host");
      }),
    );

    await expect(
      fetchClassicalStations({ limit: 1, timeoutMs: 1000 }),
    ).rejects.toBeInstanceOf(RadioBrowserError);
  });

  it("treats AbortController cancellation as lifecycle, not failure", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchClassicalStations({ signal: controller.signal }),
    ).resolves.toBeNull();
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
