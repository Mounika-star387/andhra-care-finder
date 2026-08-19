export const UNAVAILABLE = "Information unavailable";

export type Hospital = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  userRatingCount: number | null;
  openNow: boolean | null;
  phone: string | null;
  website: string | null;
  photoName: string | null;
  photoNames?: string[];
  types: string[];
  businessStatus: string | null;
  weekdayHours: string[] | null;
  googleMapsUri: string | null;
  editorialSummary: string | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
};

export type LatLng = { lat: number; lng: number };

export function photoUrl(photoName: string | null | undefined, maxPx = 800): string | null {
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  if (!photoName || !key) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxPx}&maxWidthPx=${maxPx}&key=${key}`;
}

export function formatDistance(meters?: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return UNAVAILABLE;
  if (meters < 950) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return "Travel time unavailable";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min by car`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min by car`;
}

export function isGovernment(h: Hospital): boolean {
  return /govt|government|district|civil|general hospital|area hospital|community health|phc|chc|municipal|state|ap\s|sarkari|medical college/i.test(
    h.name,
  );
}

export function looksEmergency(h: Hospital): boolean {
  return (
    /emergency|trauma|casualty|24\s*x?\s*7|multi ?speciality|multi ?specialty|super ?speciality/i.test(
      `${h.name} ${h.editorialSummary ?? ""}`,
    ) || h.types.includes("hospital")
  );
}

export function hospitalKind(h: Hospital): string {
  if (isGovernment(h)) return "Government";
  if (h.types.includes("hospital") || h.types.includes("doctor")) return "Private";
  return UNAVAILABLE;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Very small natural-language parser for voice commands. */
export function parseVoiceCommand(text: string): {
  query: string;
  radiusKm?: number;
  openNow?: boolean;
  emergency?: boolean;
  government?: boolean;
} {
  const t = text.toLowerCase();
  const km = t.match(/(\d+(?:\.\d+)?)\s*(?:km|kilomet)/);
  return {
    query: text.trim(),
    radiusKm: km ? Number(km[1]) : undefined,
    openNow: /open now|currently open/.test(t) || undefined,
    emergency: /emergency|trauma|casualty|ambulance/.test(t) || undefined,
    government: /government|govt|public hospital/.test(t) || undefined,
  };
}
