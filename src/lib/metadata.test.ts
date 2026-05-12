import { describe, expect, it, vi } from "vitest";
import {
  createMetadataPacingState,
  fetchNowPlayingMetadata,
  getMetadataDisplayKey,
  getMetadataTransitionPhase,
  getNowPlayingPrimaryMapLine,
  isSrgSwissClassicStreamUrl,
  normalizeMetadataText,
  parseNowPlaying,
  resolveMetadataPacingTransition,
} from "./metadata";
import type { Station } from "./types";

describe("metadata normalization", () => {
  it("cleans separators, station repetition, whitespace, and uppercase text", () => {
    expect(
      normalizeMetadataText(
        "BBC Radio 3 -- LUDWIG VAN BEETHOVEN  --- SYMPHONY NO. 5",
        "BBC Radio 3",
      ),
    ).toBe("Ludwig van Beethoven - Symphony No. 5");
  });

  it("extracts composer, work, and orchestra from compact classical metadata", () => {
    const parsed = parseNowPlaying(
      "BEETHOVEN - SYMPHONY NO.5 - BERLIN PHILHARMONIC",
      "Radio Klassik",
    );

    expect(parsed).toMatchObject({
      composer: "Beethoven",
      workTitle: "Symphony No. 5",
      orchestra: "Berlin Philharmonic",
      performer: "Berlin Philharmonic",
    });
  });

  it("recognizes conductor and soloist cues deterministically", () => {
    const parsed = parseNowPlaying(
      "Mozart | Piano Concerto No. 21 | Mitsuko Uchida piano | cond. Simon Rattle",
      "BBC Radio 3",
    );

    expect(parsed).toMatchObject({
      composer: "Mozart",
      workTitle: "Piano Concerto No. 21",
      soloist: "Mitsuko Uchida piano",
      conductor: "Simon Rattle",
    });
  });

  it("extracts catalog numbers, movement, orchestra, and conductor", () => {
    const parsed = parseNowPlaying(
      "BRAHMS - SYMPHONY NO. 3 IN F MAJOR, OP. 90 - III. POCO ALLEGRETTO - BERLIN PHILHARMONIC - cond. Claudio Abbado",
      "Radio Klassik",
    );

    expect(parsed).toMatchObject({
      composer: "Brahms",
      workTitle: "Symphony No. 3 in F major, Op. 90",
      movement: "III. Poco Allegretto",
      orchestra: "Berlin Philharmonic",
      conductor: "Claudio Abbado",
    });
  });

  it("preserves lightweight catalog systems and soloist attribution", () => {
    const parsed = parseNowPlaying(
      "Vivaldi / Violin Concerto in G minor RV 315 / Anne-Sophie Mutter violin",
      "Venice Classic Radio",
    );

    expect(parsed).toMatchObject({
      composer: "Vivaldi",
      workTitle: "Violin Concerto in G minor RV 315",
      soloist: "Anne-Sophie Mutter violin",
    });
  });

  it("parses composer, work title, and performer without losing accents", () => {
    const parsed = parseNowPlaying(
      "Claude Debussy - Prélude à l'après-midi d'un faune - Orchestre de Paris",
      "France Musique",
    );

    expect(parsed).toMatchObject({
      composer: "Claude Debussy",
      workTitle: "Prélude à l'après-midi d'un faune",
      performer: "Orchestre de Paris",
    });
  });

  it("handles JSON metadata payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            composer: "J. S. Bach",
            work: "Goldberg Variations, BWV 988: Aria",
            performer: "Murray Perahia",
            conductor: "Trevor Pinnock",
          }),
          { headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(fetchNowPlayingMetadata(stationFixture())).resolves.toMatchObject({
      composer: "J. S. Bach",
      workTitle: "Goldberg Variations, BWV 988",
      movement: "Aria",
      performer: "Murray Perahia",
      conductor: "Trevor Pinnock",
    });

    vi.unstubAllGlobals();
  });

  it("loads Radio Swiss Classic from SRG Deliver GraphQL when metadataUrl is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toContain("ssatr.playlist-api.deliver.media");
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            data: {
              channel: {
                playingnow: {
                  current: {
                    metadata: {
                      title: "Symphony No. 5",
                      composer: "Beethoven",
                      artist: "Vienna Philharmonic",
                    },
                  },
                },
              },
            },
          }),
          { headers: { "content-type": "application/json" } },
        );
      }),
    );

    const station: Station = {
      ...stationFixture(),
      metadataUrl: undefined,
      metadataFormat: undefined,
      name: "Radio Swiss Classic",
      url: "https://stream.srg-ssr.ch/srgssr/rsc_de/aac/96",
    };

    await expect(fetchNowPlayingMetadata(station)).resolves.toMatchObject({
      composer: "Beethoven",
      workTitle: "Symphony No. 5",
      performer: "Vienna Philharmonic",
    });

    vi.unstubAllGlobals();
  });
});

describe("isSrgSwissClassicStreamUrl", () => {
  it("matches SRG Swiss Classic stream paths", () => {
    expect(
      isSrgSwissClassicStreamUrl("https://stream.srg-ssr.ch/srgssr/rsc_de/aac/96"),
    ).toBe(true);
    expect(
      isSrgSwissClassicStreamUrl("https://stream.srg-ssr.ch/srgssr/rsc_it/mp3/128"),
    ).toBe(true);
  });

  it("rejects other SRG streams and unrelated URLs", () => {
    expect(
      isSrgSwissClassicStreamUrl("https://stream.srg-ssr.ch/srgssr/rsj_de/aac/96"),
    ).toBe(false);
    expect(isSrgSwissClassicStreamUrl("https://example.com/rsc_de/x")).toBe(false);
  });
});

describe("metadata display transitions", () => {
  it("keeps stable metadata steady and detects musical changes", () => {
    const previous = parseNowPlaying(
      "Beethoven - Symphony No. 5 - Berlin Philharmonic",
      "BBC Radio 3",
    );
    const same = previous ? { ...previous, updatedAt: previous.updatedAt + 1 } : null;
    const next = parseNowPlaying(
      "Beethoven - Symphony No. 6 - Berlin Philharmonic",
      "BBC Radio 3",
    );

    expect(getMetadataTransitionPhase(null, previous)).toBe("changing");
    expect(getMetadataTransitionPhase(previous, same)).toBe("steady");
    expect(getMetadataTransitionPhase(previous, next)).toBe("changing");
    expect(getMetadataDisplayKey(previous)).toContain("Symphony No. 5");
  });

  it("holds same-station metadata briefly before entering the next work", () => {
    const previous = parseNowPlaying(
      "Beethoven - Symphony No. 5 - Berlin Philharmonic",
      "BBC Radio 3",
    );
    const next = parseNowPlaying(
      "Beethoven - Symphony No. 6 - Berlin Philharmonic",
      "BBC Radio 3",
    );
    if (!previous || !next) throw new Error("Fixture metadata did not parse");

    const initial = createMetadataPacingState(previous, 1000);
    const holding = resolveMetadataPacingTransition(initial, next, 1100, 700);

    expect(holding.phase).toBe("holding");
    expect(holding.visible?.workTitle).toBe("Symphony No. 5");
    expect(holding.pending?.workTitle).toBe("Symphony No. 6");

    const entered = resolveMetadataPacingTransition(holding, next, 1800, 700);

    expect(entered.phase).toBe("entering");
    expect(entered.visible?.workTitle).toBe("Symphony No. 6");
  });

  it("switches station metadata immediately instead of showing stale station text", () => {
    const previous = parseNowPlaying(
      "Beethoven - Symphony No. 5 - Berlin Philharmonic",
      "BBC Radio 3",
    );
    const nextStation = parseNowPlaying(
      "Debussy - La mer - Orchestre de Paris",
      "France Musique",
    );
    if (!previous || !nextStation) throw new Error("Fixture metadata did not parse");

    const initial = createMetadataPacingState(previous, 1000);
    const entered = resolveMetadataPacingTransition(initial, nextStation, 1100, 700);

    expect(entered.phase).toBe("entering");
    expect(entered.visible?.stationName).toBe("France Musique");
    expect(entered.pending).toBeNull();
  });
});

describe("getNowPlayingPrimaryMapLine", () => {
  it("falls back to station name when metadata is null", () => {
    expect(getNowPlayingPrimaryMapLine(null, "Radio Swiss")).toBe("Radio Swiss");
  });

  it("prefers composer and work title together", () => {
    expect(
      getNowPlayingPrimaryMapLine(
        {
          composer: "Debussy",
          workTitle: "La mer",
          raw: "Debussy - La mer",
          stationName: "Test",
          updatedAt: 0,
        },
        "BBC",
      ),
    ).toBe("Debussy · La mer");
  });

  it("uses work title alone when composer is missing", () => {
    expect(
      getNowPlayingPrimaryMapLine(
        {
          workTitle: "Pictures at an Exhibition",
          raw: "Pictures",
          stationName: "Test",
          updatedAt: 0,
        },
        "Station",
      ),
    ).toBe("Pictures at an Exhibition");
  });
});

function stationFixture(): Station {
  return {
    id: "station",
    name: "BBC Radio 3",
    url: "https://example.com/audio.mp3",
    homepage: "",
    favicon: "",
    country: "United Kingdom",
    countryCode: "GB",
    state: "",
    language: "english",
    tags: ["classical"],
    codec: "MP3",
    bitrate: 128,
    votes: 1000,
    clickCount: 10,
    lat: 51.5,
    lng: -0.12,
    isSecureStream: true,
    curationScore: 10,
    metadataUrl: "https://metadata.example.com/current",
    metadataFormat: "json",
  };
}
