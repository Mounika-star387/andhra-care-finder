import type { LatLng } from "./hospital-types";

export type SavedLocation = LatLng & { label: string };

const KEY = "ap-hospital-finder:location";

export function saveLocation(loc: SavedLocation) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    /* storage unavailable */
  }
}

export function readLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}
