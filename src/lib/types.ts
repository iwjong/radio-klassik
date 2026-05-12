export interface Station {
  id: string;
  name: string;
  url: string;
  homepage: string;
  favicon: string;
  country: string;
  countryCode: string;
  state: string;
  language: string;
  tags: string[];
  codec: string;
  bitrate: number;
  votes: number;
  clickCount: number;
  lat: number;
  lng: number;
  isSecureStream: boolean;
  curationScore: number;
  verified?: boolean;
  curatedStationId?: string;
  priorityScore?: number;
  logoUrl?: string;
  editorialDescription?: string;
  regionDescription?: string;
  listeningMood?: string;
  atmosphereHint?: string;
  metadataCleanupPrefixes?: string[];
  metadataUrl?: string;
  metadataFormat?: "json" | "text";
  city?: string;
}

export interface RawStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  clickcount: number;
  clicktrend: number;
  geo_lat: number | null;
  geo_long: number | null;
}
