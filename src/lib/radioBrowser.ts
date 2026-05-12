import type { RawStation, Station } from "./types";
import { countryCentroid } from "./geo";
import { applyCuratedStationLayer } from "./curatedStations";

const DISCOVERY_URL = "https://all.api.radio-browser.info/json/servers";
const DEFAULT_MIRRORS = ["https://de1.api.radio-browser.info"];
const LAST_MIRROR_KEY = "radio-klassik:last-radio-browser-mirror";
const DEFAULT_TIMEOUT_MS = 8500;
const CLASSICAL_SCORE_THRESHOLD = 6;

let discoveredMirrors: string[] | null = null;
let CURRENT_MIRROR = readLastMirror() ?? DEFAULT_MIRRORS[0];

export type MirrorFailureReason =
  | "dns"
  | "timeout"
  | "http"
  | "network"
  | "parse";

export interface MirrorFailure {
  mirror: string;
  reason: MirrorFailureReason;
  message: string;
  status?: number;
}

export class RadioBrowserError extends Error {
  failures: MirrorFailure[];

  constructor(message: string, failures: MirrorFailure[] = []) {
    super(message);
    this.name = "RadioBrowserError";
    this.failures = failures;
  }
}

interface MirrorServer {
  name?: string;
}

interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs: number;
}

// Radio Browser tags are crowd-authored. In a curated classical product,
// uncertain genre matches are excluded instead of allowed through.
const NEGATIVE_PATTERNS = [
  /\bjazz\b/,
  /\bsmooth\s+jazz\b/,
  /\bclassic\s+jazz\b/,
  /\btalk\b/,
  /\btalk\s+radio\b/,
  /\bpodcast\b/,
  /\breligious\b/,
  /\bchristian\b/,
  /\bchurch\b/,
  /\bhymns?\b/,
  /\bchristmas\b/,
  /\bcarols?\b/,
  /\bholiday\b/,
  /\boldies\b/,
  /\bschlager\b/,
  /\bpop\b/,
  /\brock\b/,
  /\bmetal\b/,
  /\bcountry\b/,
  /\belectronic\b/,
  /\bedm\b/,
  /\bdance\b/,
  /\bchillout\b/,
  /\bchill\b/,
  /\blounge\b/,
  /\bsoundtracks?\b/,
  /\bnews\b/,
  /\bsports?\b/,
  /\bhip\s*hop\b/,
  /\bhiphop\b/,
  /\brap\b/,
  /\bfolk\b/,
  /\bjpop\b/,
  /\bkpop\b/,
  /\bambient\b/,
  /\beasy\s+listening\b/,
  /\bbackground\b/,
  /\bsleep\b/,
  /\bmeditation\b/,
];

const POSITIVE_PATTERNS = [
  { pattern: /\bclassical\b/, weight: 4 },
  { pattern: /\bklassik\b/, weight: 4 },
  { pattern: /\bklassiek\b/, weight: 4 },
  { pattern: /\bklassische\b/, weight: 4 },
  { pattern: /\bclassique\b/, weight: 4 },
  { pattern: /\bclasica\b/, weight: 4 },
  { pattern: /\bclassica\b/, weight: 4 },
  { pattern: /\bsymphony\b/, weight: 4 },
  { pattern: /\bsymphonic\b/, weight: 4 },
  { pattern: /\borchestra\b/, weight: 4 },
  { pattern: /\borchestral\b/, weight: 4 },
  { pattern: /\bphilharmonic\b/, weight: 4 },
  { pattern: /\bphilharmon\w*\b/, weight: 4 },
  { pattern: /\bopera\b/, weight: 4 },
  { pattern: /\bbaroque\b/, weight: 4 },
  { pattern: /\bchamber\b/, weight: 4 },
  { pattern: /\bmozart\b/, weight: 3 },
  { pattern: /\bbach\b/, weight: 3 },
  { pattern: /\bbeethoven\b/, weight: 3 },
  { pattern: /\bvivaldi\b/, weight: 3 },
  { pattern: /\bclassical\s+piano\b|\bpiano\s+classical\b/, weight: 3 },
  { pattern: /\bclassical\s+violin\b|\bviolin\s+classical\b/, weight: 3 },
];

const TRUSTED_CLASSICAL_BRANDS = [
  /\bclassic\s+fm\b/,
  /\bbbc\s+radio\s*3\b/,
  /\brai\s+radio\s*3\b/,
  /\bwdr\s*3\b/,
  /\bbr-?klassik\b/,
  /\bnpo\s+klassiek\b/,
  /\bradio\s+swiss\s+classic\b/,
  /\bfrance\s+musique\b/,
  /\babc\s+classic\b/,
  /\bklara\b/,
  /\bwqxr\b/,
  /\bkusc\b/,
  /\bweta\b/,
  /\bwfmt\b/,
  /\bwcrb\b/,
  /\bwclv\b/,
  /\bking\s+fm\b/,
  /\bdr\s+p2\b/,
];

const POSITIVE_TAGS = [
  "classical",
  "classical music",
  "klassik",
  "klassiek",
  "klassische musik",
  "classique",
  "clasica",
  "clássica",
  "classica",
  "symphony",
  "symphonic",
  "orchestra",
  "orchestral",
  "philharmonic",
  "opera",
  "baroque",
  "chamber music",
  "early music",
  "piano classical",
  "violin classical",
];

export function getMirror() {
  return CURRENT_MIRROR;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function isSecureStreamUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function scoreClassicalCandidate(input: {
  name: string;
  tags: string[];
  url: string;
  votes?: number;
  codec?: string;
  bitrate?: number;
}): number {
  const nameText = foldText(input.name);
  const tagText = foldText(input.tags.join(" "));
  const combined = `${nameText} ${tagText}`;

  if (input.name.length > 120 && /[,|]/.test(input.name)) return 0;
  if (NEGATIVE_PATTERNS.some((pattern) => pattern.test(combined))) return 0;

  const tagSet = new Set(input.tags.map((tag) => foldText(tag)));
  const positiveTagCount = POSITIVE_TAGS.filter((tag) =>
    tagSet.has(foldText(tag)),
  ).length;
  const nameScore = POSITIVE_PATTERNS.reduce(
    (total, item) => total + (item.pattern.test(nameText) ? item.weight : 0),
    0,
  );
  const tagScore = POSITIVE_PATTERNS.reduce(
    (total, item) => total + (item.pattern.test(tagText) ? 2 : 0),
    0,
  );
  const brandScore = TRUSTED_CLASSICAL_BRANDS.some((pattern) =>
    pattern.test(nameText),
  )
    ? 4
    : 0;

  const hasClassicalIdentity = nameScore > 0 || brandScore > 0;
  const hasStrongTagStack = positiveTagCount >= 2;
  if (!hasClassicalIdentity && !hasStrongTagStack) return 0;

  let score = nameScore + tagScore + brandScore;
  if (isSecureStreamUrl(input.url)) score += 1.5;
  if ((input.votes ?? 0) >= 100) score += 0.5;
  if ((input.votes ?? 0) >= 1000) score += 0.5;
  if (input.codec) score += 0.25;
  if ((input.bitrate ?? 0) > 0) score += 0.25;
  return score;
}

export function isLikelyClassical(name: string, tags: string[]): boolean {
  return (
    scoreClassicalCandidate({
      name,
      tags,
      url: "https://example.invalid/stream",
    }) >= CLASSICAL_SCORE_THRESHOLD
  );
}

export function mapStation(
  r: RawStation,
  opts: { includeLegacyStreams?: boolean } = {},
): Station | null {
  const url = r.url_resolved || r.url;
  if (!url) return null;
  const isSecureStream = isSecureStreamUrl(url);
  if (!opts.includeLegacyStreams && !isSecureStream) return null;
  if (r.lastcheckok !== 1) return null;

  const tags = normalizeTags(r.tags || "");
  const curationScore = scoreClassicalCandidate({
    name: r.name,
    tags,
    url,
    votes: r.votes,
    codec: r.codec,
    bitrate: r.bitrate,
  });
  if (curationScore < CLASSICAL_SCORE_THRESHOLD) return null;

  let lat = r.geo_lat;
  let lng = r.geo_long;
  if (lat == null || lng == null || (lat === 0 && lng === 0)) {
    const centroid = countryCentroid(r.countrycode);
    if (!centroid) return null;
    const seed = hashSeed(r.stationuuid);
    lat = centroid.lat + ((seed % 1000) / 1000 - 0.5) * 2.2;
    lng = centroid.lng + (((seed >> 10) % 1000) / 1000 - 0.5) * 3.0;
  }

  return applyCuratedStationLayer({
    id: r.stationuuid,
    name: r.name.trim(),
    url,
    homepage: r.homepage,
    favicon: r.favicon,
    country: r.country,
    countryCode: r.countrycode,
    state: r.state,
    language: r.language,
    tags,
    codec: r.codec,
    bitrate: r.bitrate,
    votes: r.votes,
    clickCount: r.clickcount,
    lat,
    lng,
    isSecureStream,
    curationScore,
  });
}

function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function tryFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response | null> {
  const mirrors = await resolveMirrors(init);
  if (mirrors === null) return null;

  const failures: MirrorFailure[] = [];
  for (const mirror of mirrors) {
    try {
      const res = await fetchWithTimeout(`${mirror}${path}`, {
        ...init,
        timeoutMs: init?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
      if (res === null) return null;
      if (res.ok) {
        setCurrentMirror(mirror);
        return res;
      }
      failures.push({
        mirror,
        reason: "http",
        status: res.status,
        message: `HTTP ${res.status}`,
      });
    } catch (error) {
      if (isAbortError(error)) return null;
      failures.push({
        mirror,
        reason: classifyFailure(error),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new RadioBrowserError("All Radio Browser mirrors failed.", failures);
}

async function resolveMirrors(
  init?: RequestInit & { timeoutMs?: number },
): Promise<string[] | null> {
  if (discoveredMirrors) return orderMirrors(discoveredMirrors);

  try {
    const res = await fetchWithTimeout(DISCOVERY_URL, {
      signal: init?.signal,
      timeoutMs: init?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });
    if (res === null) return null;
    if (!res.ok) return orderMirrors(DEFAULT_MIRRORS);

    const servers = (await res.json()) as MirrorServer[];
    const mirrors = servers
      .map((server) => server.name)
      .filter((name): name is string => Boolean(name))
      .map(normalizeMirror);

    discoveredMirrors = mirrors.length > 0 ? mirrors : DEFAULT_MIRRORS;
    return orderMirrors(discoveredMirrors);
  } catch (error) {
    if (isAbortError(error)) return null;
    discoveredMirrors = DEFAULT_MIRRORS;
    return orderMirrors(discoveredMirrors);
  }
}

async function fetchWithTimeout(
  url: string,
  init: FetchWithTimeoutInit,
): Promise<Response | null> {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromParent = () => {
    controller.abort(new DOMException("Request aborted", "AbortError"));
  };

  if (init.signal?.aborted) return null;
  init.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, init.timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "Radio-Klassik/1.0",
        ...(init.headers || {}),
      },
    });
  } catch (error) {
    if (didTimeout) {
      throw new Error(`Timed out after ${init.timeoutMs}ms`, { cause: error });
    }
    if (isAbortError(error) || init.signal?.aborted) return null;
    throw error;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", abortFromParent);
  }
}

function normalizeMirror(name: string): string {
  const mirror = name.startsWith("http") ? name : `https://${name}`;
  return mirror.replace(/\/+$/, "");
}

function orderMirrors(mirrors: string[]): string[] {
  const preferred = CURRENT_MIRROR || readLastMirror();
  const ordered = preferred ? [preferred, ...mirrors] : mirrors;
  return Array.from(new Set(ordered.map(normalizeMirror)));
}

function setCurrentMirror(mirror: string) {
  CURRENT_MIRROR = normalizeMirror(mirror);
  writeLastMirror(CURRENT_MIRROR);
}

function classifyFailure(error: unknown): MirrorFailureReason {
  const message = error instanceof Error ? error.message : String(error);
  if (/timed out|timeout/i.test(message)) return "timeout";
  if (/dns|enotfound|getaddrinfo|could not resolve|resolve host/i.test(message)) {
    return "dns";
  }
  return "network";
}

function readLastMirror(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(LAST_MIRROR_KEY);
    return value ? normalizeMirror(value) : null;
  } catch {
    return null;
  }
}

function writeLastMirror(mirror: string) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_MIRROR_KEY, normalizeMirror(mirror));
    }
  } catch {
    // Storage is best-effort; the network path remains deterministic without it.
  }
}

function betterStation(a: Station, b: Station): Station {
  if ((a.priorityScore ?? 0) !== (b.priorityScore ?? 0)) {
    return (a.priorityScore ?? 0) > (b.priorityScore ?? 0) ? a : b;
  }
  if (a.isSecureStream !== b.isSecureStream) return a.isSecureStream ? a : b;
  if (a.curationScore !== b.curationScore) {
    return a.curationScore > b.curationScore ? a : b;
  }
  return a.votes >= b.votes ? a : b;
}

export interface FetchOptions {
  limit?: number;
  signal?: AbortSignal;
  includeLegacyStreams?: boolean;
  timeoutMs?: number;
}

export async function fetchClassicalStations(
  opts: FetchOptions = {},
): Promise<Station[] | null> {
  const limit = opts.limit ?? 1200;
  const querySpecs = [
    { tag: "classical", limit },
    { tag: "klassik", limit: 500 },
    { tag: "opera", limit: 240 },
    { tag: "baroque", limit: 180 },
    { tag: "symphony", limit: 160 },
    { tag: "chamber music", limit: 120 },
  ];

  const seen = new Map<string, Station>();
  const failures: MirrorFailure[] = [];
  let successfulQueries = 0;
  let abortedQueries = 0;

  await Promise.all(
    querySpecs.map(async ({ tag, limit: queryLimit }) => {
      const q =
        `/json/stations/search?tag=${encodeURIComponent(tag)}` +
        `&limit=${queryLimit}&hidebroken=true&order=clickcount&reverse=true`;
      try {
        const res = await tryFetch(q, {
          signal: opts.signal,
          timeoutMs: opts.timeoutMs,
        });
        if (res === null) {
          abortedQueries += 1;
          return;
        }
        successfulQueries += 1;
        const raw = (await res.json()) as RawStation[];
        for (const r of raw) {
          const station = mapStation(r, {
            includeLegacyStreams: opts.includeLegacyStreams,
          });
          if (!station) continue;
          const dedupeKey = station.curatedStationId ?? station.id;
          const existing = seen.get(dedupeKey);
          seen.set(
            dedupeKey,
            existing ? betterStation(existing, station) : station,
          );
        }
      } catch (error) {
        if (isAbortError(error)) {
          abortedQueries += 1;
          return;
        }
        if (error instanceof RadioBrowserError) {
          failures.push(...error.failures);
          return;
        }
        failures.push({
          mirror: "response",
          reason: "parse",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );

  if (successfulQueries === 0) {
    if (abortedQueries > 0 && failures.length === 0) return null;
    throw new RadioBrowserError(
      "Could not reach Radio Browser. Please try again in a moment.",
      failures,
    );
  }

  return Array.from(seen.values()).sort((a, b) => {
    if ((a.priorityScore ?? 0) !== (b.priorityScore ?? 0)) {
      return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
    }
    if (a.isSecureStream !== b.isSecureStream) {
      return Number(b.isSecureStream) - Number(a.isSecureStream);
    }
    if (a.votes !== b.votes) return b.votes - a.votes;
    return b.curationScore - a.curationScore;
  });
}

export async function reportClick(stationId: string): Promise<void> {
  try {
    await tryFetch(`/json/url/${stationId}`);
  } catch {
    // Analytics ping is best-effort.
  }
}

export function __resetRadioBrowserForTests() {
  discoveredMirrors = null;
  CURRENT_MIRROR = DEFAULT_MIRRORS[0];
}
