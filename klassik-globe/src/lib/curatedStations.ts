import type { Station } from "./types";

export interface CuratedStation {
  id: string;
  matchNameIncludes: string[];
  countryCode?: string;
  preferredLabel: string;
  logoUrl?: string;
  editorialDescription?: string;
  regionDescription?: string;
  listeningMood?: string;
  atmosphereHint?: string;
  metadataCleanup?: {
    removePrefixes?: string[];
  };
  priorityScore: number;
  metadataUrl?: string;
  metadataFormat?: "json" | "text";
  location?: {
    lat: number;
    lng: number;
  };
}

export const CURATED_STATIONS: CuratedStation[] = [
  {
    id: "bbc-radio-3",
    matchNameIncludes: ["bbc radio 3"],
    countryCode: "GB",
    preferredLabel: "BBC Radio 3",
    editorialDescription: "British classical, new music, opera, and cultural conversation.",
    regionDescription: "London cultural broadcasting with a concert-hall cadence.",
    listeningMood: "Expansive late-evening orchestral listening.",
    atmosphereHint: "warm concert hall",
    priorityScore: 9,
  },
  {
    id: "france-musique",
    matchNameIncludes: ["france musique"],
    countryCode: "FR",
    preferredLabel: "France Musique",
    editorialDescription: "Late-night Paris orchestral programming and French musical culture.",
    regionDescription: "A Parisian public-radio stage for performance, opera, and criticism.",
    listeningMood: "Elegant, reflective, and editorial.",
    atmosphereHint: "Paris nocturne",
    priorityScore: 9,
  },
  {
    id: "radio-swiss-classic",
    matchNameIncludes: ["radio swiss classic"],
    countryCode: "CH",
    preferredLabel: "Radio Swiss Classic",
    editorialDescription: "An elegant continuous classical stream from Switzerland.",
    regionDescription: "Swiss continuity with a calm alpine clarity.",
    listeningMood: "Quiet orchestral flow for long listening.",
    atmosphereHint: "soft alpine night",
    priorityScore: 8,
  },
  {
    id: "venice-classic-radio",
    matchNameIncludes: ["venice classic radio"],
    countryCode: "IT",
    preferredLabel: "Venice Classic Radio",
    editorialDescription: "A Venetian classical stream with a chamber-like sensibility.",
    regionDescription: "Venice, held in a small-room classical atmosphere.",
    listeningMood: "Intimate chamber listening.",
    atmosphereHint: "Venetian chamber dusk",
    priorityScore: 8,
    location: { lat: 45.44, lng: 12.32 },
  },
  {
    id: "klassik-radio",
    matchNameIncludes: ["klassik radio", "klassikradio"],
    countryCode: "DE",
    preferredLabel: "Klassik Radio",
    editorialDescription: "A polished German classical station for focused listening.",
    regionDescription: "German classical programming with a composed daily rhythm.",
    listeningMood: "Clear, focused, and measured.",
    atmosphereHint: "modern recital room",
    priorityScore: 7,
  },
  {
    id: "ndr-kultur",
    matchNameIncludes: ["ndr kultur"],
    countryCode: "DE",
    preferredLabel: "NDR Kultur",
    editorialDescription: "Northern Germany's cultural radio voice.",
    regionDescription: "Northern German concert culture with a literary edge.",
    listeningMood: "Contemporary Nordic classical atmosphere.",
    atmosphereHint: "cool northern light",
    priorityScore: 7,
  },
  {
    id: "radio-stephansdom",
    matchNameIncludes: ["radio stephansdom"],
    countryCode: "AT",
    preferredLabel: "Radio Stephansdom",
    editorialDescription: "Vienna-based sacred and classical programming.",
    regionDescription: "Vienna symphonic broadcast with sacred architecture in the room.",
    listeningMood: "Ceremonial, quiet, and resonant.",
    atmosphereHint: "Vienna stone and strings",
    priorityScore: 7,
    location: { lat: 48.208, lng: 16.373 },
  },
  {
    id: "br-klassik",
    matchNameIncludes: ["br-klassik", "br klassik"],
    countryCode: "DE",
    preferredLabel: "BR-Klassik",
    editorialDescription: "Bavarian classical radio with a strong concert tradition.",
    regionDescription: "Munich-based classical performance and public culture.",
    listeningMood: "Grounded symphonic listening.",
    atmosphereHint: "Bavarian concert evening",
    priorityScore: 7,
  },
  {
    id: "npo-klassiek",
    matchNameIncludes: ["npo klassiek"],
    countryCode: "NL",
    preferredLabel: "NPO Klassiek",
    editorialDescription: "Dutch public classical radio, direct and refined.",
    regionDescription: "A Dutch public classical voice with clean editorial pacing.",
    listeningMood: "Open, lucid, and unforced.",
    atmosphereHint: "Amsterdam quiet room",
    priorityScore: 7,
  },
  {
    id: "abc-classic",
    matchNameIncludes: ["abc classic"],
    countryCode: "AU",
    preferredLabel: "ABC Classic",
    editorialDescription: "Australia's national classical music service.",
    regionDescription: "Australian public classical programming across a broad horizon.",
    listeningMood: "Airy, generous, and calm.",
    atmosphereHint: "southern night air",
    priorityScore: 7,
  },
  {
    id: "wqxr",
    matchNameIncludes: ["wqxr"],
    countryCode: "US",
    preferredLabel: "WQXR",
    editorialDescription: "New York's classical music station.",
    regionDescription: "New York classical listening with a metropolitan pulse.",
    listeningMood: "Urban, polished, and attentive.",
    atmosphereHint: "late Manhattan window",
    priorityScore: 7,
  },
  {
    id: "classical-kdfc",
    matchNameIncludes: ["classical kdfc", "kdfc"],
    countryCode: "US",
    preferredLabel: "Classical KDFC",
    editorialDescription: "A West Coast classical station with a calm daily rhythm.",
    regionDescription: "California classical programming with a relaxed clarity.",
    listeningMood: "Warm, spacious, and unhurried.",
    atmosphereHint: "coastal evening light",
    priorityScore: 7,
  },
];

export function applyCuratedStationLayer(station: Station): Station {
  const curated = findCuratedStation(station);
  if (!curated) return station;

  return {
    ...station,
    name: curated.preferredLabel,
    lat: curated.location?.lat ?? station.lat,
    lng: curated.location?.lng ?? station.lng,
    logoUrl: curated.logoUrl ?? station.logoUrl,
    editorialDescription: curated.editorialDescription ?? station.editorialDescription,
    regionDescription: curated.regionDescription ?? station.regionDescription,
    listeningMood: curated.listeningMood ?? station.listeningMood,
    atmosphereHint: curated.atmosphereHint ?? station.atmosphereHint,
    metadataCleanupPrefixes:
      curated.metadataCleanup?.removePrefixes ?? station.metadataCleanupPrefixes,
    verified: true,
    curatedStationId: curated.id,
    priorityScore: curated.priorityScore,
    metadataUrl: curated.metadataUrl,
    metadataFormat: curated.metadataFormat,
    curationScore: station.curationScore + curated.priorityScore,
  };
}

export function findCuratedStation(station: Pick<Station, "name" | "countryCode">) {
  const name = fold(station.name);
  const countryCode = station.countryCode?.toUpperCase();

  return CURATED_STATIONS.find((candidate) => {
    if (candidate.countryCode && candidate.countryCode !== countryCode) {
      return false;
    }
    return candidate.matchNameIncludes.some((needle) => name.includes(fold(needle)));
  });
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
