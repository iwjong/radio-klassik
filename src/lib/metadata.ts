import type { Station } from "./types";

export interface NowPlayingMetadata {
  composer?: string;
  workTitle?: string;
  movement?: string;
  orchestra?: string;
  conductor?: string;
  soloist?: string;
  performer?: string;
  raw: string;
  stationName: string;
  updatedAt: number;
}

interface RawMetadataPayload {
  title?: string;
  current?: string;
  nowPlaying?: string;
  song?: string;
  artist?: string;
  composer?: string;
  work?: string;
  movement?: string;
  performer?: string;
  orchestra?: string;
  conductor?: string;
  soloist?: string;
}

const KNOWN_COMPOSERS = [
  "bach",
  "beethoven",
  "berlioz",
  "brahms",
  "bruckner",
  "chopin",
  "debussy",
  "dvorak",
  "elgar",
  "faure",
  "handel",
  "haydn",
  "liszt",
  "mahler",
  "mendelssohn",
  "mozart",
  "prokofiev",
  "puccini",
  "ravel",
  "rachmaninoff",
  "saint-saens",
  "schubert",
  "schumann",
  "shostakovich",
  "sibelius",
  "strauss",
  "stravinsky",
  "tchaikovsky",
  "verdi",
  "vivaldi",
  "wagner",
];

const WORK_PATTERNS = [
  /\bsymphony\b/i,
  /\bconcerto\b/i,
  /\bsonata\b/i,
  /\bquartet\b/i,
  /\bquintet\b/i,
  /\btrio\b/i,
  /\bmass\b/i,
  /\brequiem\b/i,
  /\boverture\b/i,
  /\bsuite\b/i,
  /\bprelude\b/i,
  /\bfugue\b/i,
  /\bvariations?\b/i,
  /\bnocturne\b/i,
  /\betude\b/i,
  /\bopera\b/i,
  /\bop\.\s*\d+/i,
  /\bbwv\s*\d+/i,
  /\bk\.\s*\d+/i,
  /\bhob\.\s*[\w:.]+/i,
  /\bd\.\s*\d+/i,
  /\brv\s*\d+/i,
];

const ENSEMBLE_PATTERNS = [
  /\borchestra\b/i,
  /\bphilharmonic\b/i,
  /\bsymphony\b/i,
  /\bensemble\b/i,
  /\bquartet\b/i,
  /\bchoir\b/i,
  /\bchorus\b/i,
  /\bopera\b/i,
  /\bakademie\b/i,
  /\bmusik\b/i,
];

const SOLOIST_PATTERNS = [
  /\bpiano\b/i,
  /\bviolin\b/i,
  /\bcello\b/i,
  /\bsoprano\b/i,
  /\btenor\b/i,
  /\bbaritone\b/i,
  /\bmezzo\b/i,
  /\bclarinet\b/i,
  /\bflute\b/i,
  /\boboe\b/i,
];

const MOVEMENT_PATTERNS = [
  /^\s*(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[.:]\s+/i,
  /\b(?:allegro|adagio|andante|aria|courante|finale|gavotte|gigue|grave|intermezzo|largo|menuet|menuetto|minuet|moderato|presto|rondo|sarabande|scherzo|vivace)\b/i,
];

export function normalizeMetadataText(raw: string, stationName = ""): string {
  let text = raw
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([|/\\•·])\s*/g, " $1 ")
    .replace(/\s*[-–—]{2,}\s*/g, " - ")
    .replace(/\s*::+\s*/g, " - ")
    .replace(/([|/\\•·-])(?:\s*\1)+/g, "$1")
    .replace(/\bno\.\s*(\d+)/gi, "No. $1")
    .replace(/\bop\.\s*(\d+)/gi, "Op. $1")
    .replace(/\bk\.\s*(\d+)/gi, "K. $1")
    .replace(/\bbwv\s*(\d+)/gi, "BWV $1")
    .replace(/\bhob\.?\s*([\w:.]+)/gi, "Hob. $1")
    .replace(/\bd\.\s*(\d+)/gi, "D. $1")
    .replace(/\brv\.?\s*(\d+)/gi, "RV $1")
    .trim();

  if (stationName) {
    const stationPattern = escapeRegExp(stationName);
    text = text
      .replace(new RegExp(`^${stationPattern}\\s*[-–—|:]+\\s*`, "i"), "")
      .replace(new RegExp(`\\s*[-–—|:]+\\s*${stationPattern}$`, "i"), "")
      .trim();
  }

  if (isMostlyUppercase(text)) {
    text = titleCase(text);
  }

  return text;
}

export function parseNowPlaying(
  raw: string,
  stationName: string,
): NowPlayingMetadata | null {
  const normalized = normalizeMetadataText(raw, stationName);
  if (!normalized || normalized.length < 3) return null;

  const parts = splitMetadataParts(normalized);

  if (parts.length === 0) return null;

  const composerIndex = parts.findIndex((part) => looksLikeComposer(part));
  const composer =
    composerIndex >= 0
      ? cleanComposerName(parts[composerIndex])
      : extractComposerPrefix(parts[0]);
  const composerPartIndex = composerIndex >= 0 ? composerIndex : composer ? 0 : -1;
  const remaining =
    composerPartIndex >= 0
      ? parts.filter((_, index) => index !== composerPartIndex)
      : parts;

  const workIndex = remaining.findIndex(looksLikeWork);
  const work = splitWorkAndMovement(cleanWorkTitle(
    (workIndex >= 0 ? remaining[workIndex] : remaining[0]) ??
      (composer ? normalized.replace(composer, "").trim() : normalized),
  ));
  const adjacentMovementIndex =
    workIndex >= 0 ? findAdjacentMovementIndex(remaining, workIndex) : -1;
  const movement =
    work.movement ??
    (adjacentMovementIndex >= 0
      ? cleanMovementTitle(remaining[adjacentMovementIndex])
      : undefined);
  const performerParts = remaining.filter((_, index) =>
    workIndex >= 0
      ? index !== workIndex && index !== adjacentMovementIndex
      : index !== 0,
  );
  const performance = classifyPerformanceParts(performerParts);

  return {
    composer: composer || undefined,
    workTitle: cleanEmpty(work.workTitle),
    movement,
    orchestra: performance.orchestra,
    conductor: performance.conductor,
    soloist: performance.soloist,
    performer: performance.performer,
    raw: normalized,
    stationName,
    updatedAt: Date.now(),
  };
}

const SRG_DELIVER_GRAPHQL = "https://ssatr.playlist-api.deliver.media/graphql";

/** SRG Swiss Classic / Pop / Jazz streams share this playlist API; we only wire Classic (rsc_). */
const SWISS_CLASSIC_GRAPHQL: Record<
  string,
  { channelId: string; titleSelection: string }
> = {
  de: {
    channelId: "0191e9e4-ffc8-782b-8ace-6604e0d6f2dc",
    titleSelection: "TitleDE",
  },
  en: {
    channelId: "0191e9e4-ffc8-782b-8ace-6604e0d6f2dc",
    titleSelection: "TitleEN",
  },
  fr: {
    channelId: "0191e9e5-213d-705e-b520-cee967358e6f",
    titleSelection: "TitleFR",
  },
  it: {
    channelId: "0191e9e5-3db3-7deb-ae10-48c24845852b",
    titleSelection: "TitleIT",
  },
};

export function stationSupportsNowPlayingFetch(station: Pick<Station, "metadataUrl" | "url">): boolean {
  return Boolean(station.metadataUrl) || isSrgSwissClassicStreamUrl(station.url);
}

export function isSrgSwissClassicStreamUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("srg-ssr.ch") &&
      /\/srgssr\/rsc_(de|en|fr|it)\//i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

export async function fetchNowPlayingMetadata(
  station: Station,
  signal?: AbortSignal,
): Promise<NowPlayingMetadata | null> {
  if (station.metadataUrl) {
    return fetchNowPlayingFromHttp(station, signal);
  }

  const srgClassic = await fetchSrgSwissClassicNowPlaying(station, signal);
  if (srgClassic) return srgClassic;

  return null;
}

async function fetchNowPlayingFromHttp(
  station: Station,
  signal?: AbortSignal,
): Promise<NowPlayingMetadata | null> {
  if (!station.metadataUrl) return null;

  const response = await fetch(station.metadataUrl, { signal });
  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (station.metadataFormat === "json" || contentType.includes("json")) {
    const payload = (await response.json()) as RawMetadataPayload;
    return parsePayload(payload, station.name);
  }

  return parseNowPlaying(await response.text(), station.name);
}

interface SrgDeliverPlayingResponse {
  data?: {
    channel?: {
      playingnow?: {
        current?: {
          metadata?: {
            title?: string;
            composer?: string;
            artist?: string;
          };
        };
      };
    };
  };
}

async function fetchSrgSwissClassicNowPlaying(
  station: Station,
  signal?: AbortSignal,
): Promise<NowPlayingMetadata | null> {
  if (!isSrgSwissClassicStreamUrl(station.url)) return null;

  const langMatch = station.url.match(/\/rsc_(de|en|fr|it)\//i);
  const lang = langMatch ? langMatch[1].toLowerCase() : "de";
  const cfg = SWISS_CLASSIC_GRAPHQL[lang] ?? SWISS_CLASSIC_GRAPHQL.de;

  const query = `query ($chan: String) {
    channel(id: $chan) {
      playingnow {
        current {
          metadata {
            title: ${cfg.titleSelection}
            composer: ComposerMain
            artist
          }
        }
      }
    }
  }`;

  const response = await fetch(SRG_DELIVER_GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { chan: cfg.channelId } }),
    signal,
  });

  if (!response.ok) return null;

  const body = (await response.json()) as SrgDeliverPlayingResponse;
  const meta = body.data?.channel?.playingnow?.current?.metadata;
  if (!meta) return null;

  const title = meta.title?.trim();
  const composer = meta.composer?.trim();
  const artist = meta.artist?.trim();
  if (!title && !composer) return null;

  const raw = [composer, title].filter(Boolean).join(" - ") || title || composer || "";
  const parsed = parseNowPlaying(raw, station.name);
  const performer =
    artist && composer && artist !== composer ? artist : parsed?.performer;

  return {
    composer: composer || parsed?.composer,
    workTitle: title || parsed?.workTitle,
    movement: parsed?.movement,
    orchestra: parsed?.orchestra,
    conductor: parsed?.conductor,
    soloist: parsed?.soloist,
    performer,
    raw: parsed?.raw ?? normalizeMetadataText(raw, station.name),
    stationName: station.name,
    updatedAt: Date.now(),
  };
}

function parsePayload(
  payload: RawMetadataPayload,
  stationName: string,
): NowPlayingMetadata | null {
  const raw =
    payload.title ??
    payload.current ??
    payload.nowPlaying ??
    payload.song ??
    [payload.artist, payload.work].filter(Boolean).join(" - ");

  if (!raw && !payload.composer && !payload.work && !payload.performer) {
    return null;
  }

  const parsed = parseNowPlaying(raw || "", stationName);
  const payloadWork = splitWorkAndMovement(cleanWorkTitle(cleanEmpty(payload.work) ?? ""));
  return {
    raw: parsed?.raw ?? normalizeMetadataText(raw || "", stationName),
    stationName,
    updatedAt: Date.now(),
    composer: cleanComposerName(cleanEmpty(payload.composer) ?? "") || parsed?.composer,
    workTitle: payloadWork.workTitle || parsed?.workTitle,
    movement:
      cleanMovementTitle(cleanEmpty(payload.movement) ?? "") ||
      payloadWork.movement ||
      parsed?.movement,
    orchestra: cleanEmpty(payload.orchestra) ?? parsed?.orchestra,
    conductor: cleanEmpty(payload.conductor) ?? parsed?.conductor,
    soloist: cleanEmpty(payload.soloist) ?? parsed?.soloist,
    performer: cleanEmpty(payload.performer) ?? parsed?.performer,
  };
}

function splitMetadataParts(value: string): string[] {
  return value
    .split(/\s+(?:[-–—|/\\•·])\s+|\s*:\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikeComposer(value: string): boolean {
  const folded = fold(value);
  return KNOWN_COMPOSERS.some((composer) => folded.includes(composer));
}

function extractComposerPrefix(value: string): string | null {
  const colonIndex = value.indexOf(":");
  if (colonIndex <= 0) return null;
  const prefix = value.slice(0, colonIndex).trim();
  return looksLikeComposer(prefix) ? cleanComposerName(prefix) : null;
}

function looksLikeWork(value: string): boolean {
  return WORK_PATTERNS.some((pattern) => pattern.test(value));
}

function looksLikeMovement(value: string): boolean {
  return MOVEMENT_PATTERNS.some((pattern) => pattern.test(value));
}

function findAdjacentMovementIndex(parts: string[], workIndex: number): number {
  const nextIndex = workIndex + 1;
  const next = parts[nextIndex];
  if (!next || !looksLikeMovement(next)) return -1;
  if (ENSEMBLE_PATTERNS.some((pattern) => pattern.test(next))) return -1;
  if (SOLOIST_PATTERNS.some((pattern) => pattern.test(next))) return -1;
  return nextIndex;
}

function splitWorkAndMovement(value: string): {
  workTitle: string;
  movement?: string;
} {
  const clean = cleanEmpty(value) ?? "";
  if (!clean) return { workTitle: "" };

  for (const separator of [/\s*[:;]\s+/, /\s+-\s+/]) {
    const parts = clean.split(separator).map((part) => part.trim()).filter(Boolean);
    const movementIndex = parts.findIndex((part, index) =>
      index > 0 && looksLikeMovement(part),
    );
    if (movementIndex > 0) {
      return {
        workTitle: parts.slice(0, movementIndex).join(" - "),
        movement: cleanMovementTitle(parts.slice(movementIndex).join(" - ")),
      };
    }
  }

  const commaParts = clean.split(/\s*,\s*/).filter(Boolean);
  const commaMovementIndex = commaParts.findIndex((part, index) =>
    index > 0 && looksLikeMovement(part),
  );
  if (commaMovementIndex > 0) {
    return {
      workTitle: commaParts.slice(0, commaMovementIndex).join(", "),
      movement: cleanMovementTitle(commaParts.slice(commaMovementIndex).join(", ")),
    };
  }

  return { workTitle: clean };
}

function classifyPerformanceParts(parts: string[]) {
  const orchestra: string[] = [];
  const conductor: string[] = [];
  const soloist: string[] = [];
  const other: string[] = [];

  for (const part of parts.map(cleanPerformancePart).filter(Boolean)) {
    if (/\b(?:cond\.?|conductor|conducted by|dir\.?)\b/i.test(part)) {
      conductor.push(cleanConductor(part));
    } else if (ENSEMBLE_PATTERNS.some((pattern) => pattern.test(part))) {
      orchestra.push(part);
    } else if (SOLOIST_PATTERNS.some((pattern) => pattern.test(part))) {
      soloist.push(part);
    } else {
      other.push(part);
    }
  }

  return {
    orchestra: cleanEmpty(orchestra.join(" · ")),
    conductor: cleanEmpty(conductor.join(" · ")),
    soloist: cleanEmpty(soloist.join(" · ")),
    performer: cleanEmpty([...orchestra, ...soloist, ...conductor, ...other].join(" · ")),
  };
}

function cleanComposerName(value: string): string {
  return cleanEmpty(prettifyMetadataSegment(value).replace(/\bby\b\s*/i, "")) ?? "";
}

function cleanWorkTitle(value: string): string {
  return normalizeCatalogs(prettifyMetadataSegment(cleanEmpty(value) ?? ""));
}

function cleanMovementTitle(value: string): string | undefined {
  const clean = normalizeCatalogs(prettifyMetadataSegment(cleanEmpty(value) ?? ""));
  return cleanEmpty(normalizeRomanNumerals(clean));
}

function normalizeCatalogs(value: string): string {
  return value
    .replace(/\bno\.\s*(\d+)/gi, "No. $1")
    .replace(/\bop\.\s*(\d+)/gi, "Op. $1")
    .replace(/\bk\.\s*(\d+)/gi, "K. $1")
    .replace(/\bbwv\s*(\d+)/gi, "BWV $1")
    .replace(/\bhob\.?\s*([\w:.]+)/gi, "Hob. $1")
    .replace(/\bd\.\s*(\d+)/gi, "D. $1")
    .replace(/\brv\.?\s*(\d+)/gi, "RV $1");
}

function cleanPerformancePart(value: string): string {
  return prettifyMetadataSegment(value)
    .replace(/\s*\((?:live|stereo|hd|aac|mp3)[^)]*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanConductor(value: string): string {
  return value
    .replace(/\b(?:cond\.?|conductor|conducted by|dir\.?)\b[:.]?\s*/gi, "")
    .replace(/\s*,\s*$/g, "")
    .trim();
}

function isMostlyUppercase(value: string): boolean {
  const letters = [...value].filter((char) => /\p{L}/u.test(char));
  if (letters.length < 4) return false;
  const uppercase = letters.filter((char) => char === char.toLocaleUpperCase());
  return uppercase.length / letters.length > 0.82;
}

function cleanEmpty(value: string | undefined): string | undefined {
  const clean = value?.trim();
  return clean || undefined;
}

function prettifyMetadataSegment(value: string): string {
  return isMostlyUppercase(value) ? titleCase(value) : value;
}

function titleCase(value: string): string {
  const lowerParticles = new Set([
    "a",
    "an",
    "and",
    "da",
    "de",
    "del",
    "der",
    "di",
    "du",
    "in",
    "la",
    "le",
    "major",
    "minor",
    "of",
    "the",
    "und",
    "van",
    "von",
  ]);
  return value
    .toLocaleLowerCase()
    .replace(/\b\p{L}[\p{L}'’]*/gu, (word, offset) => {
      if (offset > 0 && lowerParticles.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase() + word.slice(1);
    })
    .replace(/\bNo\. (\d+)/g, "No. $1")
    .replace(/\bOp\. (\d+)/g, "Op. $1")
    .replace(/\bBwv\b/g, "BWV")
    .replace(/\bRv\b/g, "RV")
    .replace(/\bHob\.?\s*/g, "Hob. ")
    .replace(/\b([ivx]{1,5})\./gi, (match) => match.toLocaleUpperCase());
}

function normalizeRomanNumerals(value: string): string {
  return value.replace(/\b([ivx]{1,5})\./gi, (match) => match.toLocaleUpperCase());
}

export type MetadataTransitionPhase = "empty" | "steady" | "changing";
export type MetadataPacingPhase = "empty" | "steady" | "holding" | "entering";

export const METADATA_PACING_HOLD_MS = 720;

export interface MetadataPacingState {
  visible: NowPlayingMetadata | null;
  pending: NowPlayingMetadata | null;
  phase: MetadataPacingPhase;
  changedAt: number;
}

export function getMetadataDisplayKey(
  metadata: NowPlayingMetadata | null,
): string {
  if (!metadata) return "empty";
  return [
    metadata.composer,
    metadata.workTitle,
    metadata.movement,
    metadata.orchestra,
    metadata.conductor,
    metadata.soloist,
    metadata.performer,
    metadata.stationName,
    metadata.raw,
  ]
    .filter(Boolean)
    .join("|");
}

/** One-line title for the active station’s map marker (work / movement first). */
export function getNowPlayingPrimaryMapLine(
  metadata: NowPlayingMetadata | null,
  stationName: string,
): string {
  const fallback = stationName.trim() || "On air";
  if (!metadata) return fallback;
  if (metadata.workTitle) {
    return metadata.composer
      ? `${metadata.composer} · ${metadata.workTitle}`
      : metadata.workTitle;
  }
  if (metadata.composer && metadata.movement) {
    return `${metadata.composer} · ${metadata.movement}`;
  }
  if (metadata.composer) return metadata.composer;
  const raw = metadata.raw?.trim();
  if (raw && raw.length >= 3) return raw;
  return fallback;
}

export function getMetadataTransitionPhase(
  previous: NowPlayingMetadata | null,
  current: NowPlayingMetadata | null,
): MetadataTransitionPhase {
  if (!current) return "empty";
  if (!previous) return "changing";
  return getMetadataDisplayKey(previous) === getMetadataDisplayKey(current)
    ? "steady"
    : "changing";
}

export function createMetadataPacingState(
  metadata: NowPlayingMetadata | null,
  now = Date.now(),
): MetadataPacingState {
  return {
    visible: metadata,
    pending: null,
    phase: metadata ? "entering" : "empty",
    changedAt: now,
  };
}

export function resolveMetadataPacingTransition(
  state: MetadataPacingState,
  incoming: NowPlayingMetadata | null,
  now = Date.now(),
  holdMs = METADATA_PACING_HOLD_MS,
): MetadataPacingState {
  if (!incoming) {
    return {
      visible: null,
      pending: null,
      phase: "empty",
      changedAt: now,
    };
  }

  if (!state.visible || state.visible.stationName !== incoming.stationName) {
    return {
      visible: incoming,
      pending: null,
      phase: "entering",
      changedAt: now,
    };
  }

  if (getMetadataDisplayKey(state.visible) === getMetadataDisplayKey(incoming)) {
    return {
      visible: incoming,
      pending: null,
      phase: "steady",
      changedAt: state.changedAt,
    };
  }

  if (
    state.pending &&
    getMetadataDisplayKey(state.pending) === getMetadataDisplayKey(incoming) &&
    now - state.changedAt >= holdMs
  ) {
    return {
      visible: incoming,
      pending: null,
      phase: "entering",
      changedAt: now,
    };
  }

  return {
    visible: state.visible,
    pending: incoming,
    phase: "holding",
    changedAt:
      state.phase === "holding" &&
      state.pending &&
      getMetadataDisplayKey(state.pending) === getMetadataDisplayKey(incoming)
        ? state.changedAt
        : now,
  };
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
