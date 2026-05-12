// Approximate country centroids (lat, lng) used as fallback when a station
// has no geo coordinates. Source: simplified from Natural Earth + Wikipedia.
// Codes are ISO 3166-1 alpha-2.

interface Centroid {
  lat: number;
  lng: number;
  name: string;
}

const CENTROIDS: Record<string, Centroid> = {
  AD: { lat: 42.546, lng: 1.601, name: "Andorra" },
  AE: { lat: 23.424, lng: 53.847, name: "United Arab Emirates" },
  AF: { lat: 33.93, lng: 67.71, name: "Afghanistan" },
  AL: { lat: 41.153, lng: 20.168, name: "Albania" },
  AM: { lat: 40.069, lng: 45.038, name: "Armenia" },
  AR: { lat: -38.416, lng: -63.617, name: "Argentina" },
  AT: { lat: 47.516, lng: 14.55, name: "Austria" },
  AU: { lat: -25.274, lng: 133.775, name: "Australia" },
  AZ: { lat: 40.143, lng: 47.577, name: "Azerbaijan" },
  BA: { lat: 43.916, lng: 17.679, name: "Bosnia and Herzegovina" },
  BE: { lat: 50.504, lng: 4.469, name: "Belgium" },
  BG: { lat: 42.733, lng: 25.486, name: "Bulgaria" },
  BO: { lat: -16.29, lng: -63.589, name: "Bolivia" },
  BR: { lat: -14.235, lng: -51.925, name: "Brazil" },
  BY: { lat: 53.709, lng: 27.953, name: "Belarus" },
  CA: { lat: 56.13, lng: -106.347, name: "Canada" },
  CH: { lat: 46.818, lng: 8.228, name: "Switzerland" },
  CL: { lat: -35.675, lng: -71.543, name: "Chile" },
  CN: { lat: 35.862, lng: 104.195, name: "China" },
  CO: { lat: 4.571, lng: -74.297, name: "Colombia" },
  CR: { lat: 9.749, lng: -83.753, name: "Costa Rica" },
  CU: { lat: 21.522, lng: -77.781, name: "Cuba" },
  CY: { lat: 35.126, lng: 33.43, name: "Cyprus" },
  CZ: { lat: 49.817, lng: 15.473, name: "Czechia" },
  DE: { lat: 51.165, lng: 10.451, name: "Germany" },
  DK: { lat: 56.263, lng: 9.501, name: "Denmark" },
  DO: { lat: 18.735, lng: -70.162, name: "Dominican Republic" },
  EC: { lat: -1.831, lng: -78.183, name: "Ecuador" },
  EE: { lat: 58.595, lng: 25.013, name: "Estonia" },
  EG: { lat: 26.82, lng: 30.802, name: "Egypt" },
  ES: { lat: 40.463, lng: -3.749, name: "Spain" },
  FI: { lat: 61.924, lng: 25.748, name: "Finland" },
  FR: { lat: 46.227, lng: 2.213, name: "France" },
  GB: { lat: 55.378, lng: -3.435, name: "United Kingdom" },
  GE: { lat: 42.315, lng: 43.357, name: "Georgia" },
  GR: { lat: 39.074, lng: 21.824, name: "Greece" },
  HK: { lat: 22.396, lng: 114.109, name: "Hong Kong" },
  HR: { lat: 45.1, lng: 15.2, name: "Croatia" },
  HU: { lat: 47.162, lng: 19.503, name: "Hungary" },
  ID: { lat: -0.789, lng: 113.921, name: "Indonesia" },
  IE: { lat: 53.142, lng: -7.692, name: "Ireland" },
  IL: { lat: 31.046, lng: 34.852, name: "Israel" },
  IN: { lat: 20.594, lng: 78.963, name: "India" },
  IR: { lat: 32.428, lng: 53.688, name: "Iran" },
  IS: { lat: 64.963, lng: -19.021, name: "Iceland" },
  IT: { lat: 41.872, lng: 12.567, name: "Italy" },
  JM: { lat: 18.109, lng: -77.297, name: "Jamaica" },
  JO: { lat: 30.585, lng: 36.238, name: "Jordan" },
  JP: { lat: 36.205, lng: 138.253, name: "Japan" },
  KE: { lat: -0.024, lng: 37.906, name: "Kenya" },
  KR: { lat: 35.908, lng: 127.767, name: "South Korea" },
  KZ: { lat: 48.02, lng: 66.924, name: "Kazakhstan" },
  LB: { lat: 33.855, lng: 35.862, name: "Lebanon" },
  LT: { lat: 55.169, lng: 23.881, name: "Lithuania" },
  LU: { lat: 49.815, lng: 6.13, name: "Luxembourg" },
  LV: { lat: 56.879, lng: 24.603, name: "Latvia" },
  MA: { lat: 31.792, lng: -7.093, name: "Morocco" },
  MD: { lat: 47.412, lng: 28.37, name: "Moldova" },
  ME: { lat: 42.708, lng: 19.374, name: "Montenegro" },
  MK: { lat: 41.608, lng: 21.745, name: "North Macedonia" },
  MT: { lat: 35.937, lng: 14.375, name: "Malta" },
  MX: { lat: 23.635, lng: -102.553, name: "Mexico" },
  MY: { lat: 4.211, lng: 101.976, name: "Malaysia" },
  NG: { lat: 9.082, lng: 8.675, name: "Nigeria" },
  NL: { lat: 52.133, lng: 5.291, name: "Netherlands" },
  NO: { lat: 60.472, lng: 8.469, name: "Norway" },
  NP: { lat: 28.395, lng: 84.124, name: "Nepal" },
  NZ: { lat: -40.901, lng: 174.886, name: "New Zealand" },
  PE: { lat: -9.19, lng: -75.015, name: "Peru" },
  PH: { lat: 12.879, lng: 121.774, name: "Philippines" },
  PL: { lat: 51.919, lng: 19.145, name: "Poland" },
  PT: { lat: 39.4, lng: -8.224, name: "Portugal" },
  PY: { lat: -23.443, lng: -58.443, name: "Paraguay" },
  QA: { lat: 25.354, lng: 51.184, name: "Qatar" },
  RO: { lat: 45.943, lng: 24.967, name: "Romania" },
  RS: { lat: 44.016, lng: 21.006, name: "Serbia" },
  RU: { lat: 61.524, lng: 105.319, name: "Russia" },
  SA: { lat: 23.886, lng: 45.079, name: "Saudi Arabia" },
  SE: { lat: 60.128, lng: 18.644, name: "Sweden" },
  SG: { lat: 1.352, lng: 103.82, name: "Singapore" },
  SI: { lat: 46.151, lng: 14.995, name: "Slovenia" },
  SK: { lat: 48.669, lng: 19.699, name: "Slovakia" },
  TH: { lat: 15.87, lng: 100.992, name: "Thailand" },
  TN: { lat: 33.886, lng: 9.537, name: "Tunisia" },
  TR: { lat: 38.964, lng: 35.243, name: "Türkiye" },
  TW: { lat: 23.698, lng: 120.961, name: "Taiwan" },
  UA: { lat: 48.379, lng: 31.166, name: "Ukraine" },
  US: { lat: 37.09, lng: -95.713, name: "United States" },
  UY: { lat: -32.523, lng: -55.766, name: "Uruguay" },
  UZ: { lat: 41.378, lng: 64.585, name: "Uzbekistan" },
  VE: { lat: 6.423, lng: -66.59, name: "Venezuela" },
  VN: { lat: 14.058, lng: 108.277, name: "Vietnam" },
  ZA: { lat: -30.559, lng: 22.937, name: "South Africa" },
};

export function countryCentroid(
  code: string | undefined | null,
): { lat: number; lng: number } | null {
  if (!code) return null;
  const c = CENTROIDS[code.toUpperCase()];
  return c ? { lat: c.lat, lng: c.lng } : null;
}

export function countryName(code: string | undefined | null): string | null {
  if (!code) return null;
  return CENTROIDS[code.toUpperCase()]?.name ?? null;
}
