import type { Hospital, LatLng } from "./hospital-types";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function creds() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovable || !conn) throw new Error("Google Maps connection is not configured.");
  return { lovable, conn };
}

async function gateway(path: string, init: RequestInit & { fieldMask?: string } = {}) {
  const { lovable, conn } = creds();
  const { fieldMask, headers, ...rest } = init;
  const res = await fetch(`${GATEWAY}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": conn,
      "Content-Type": "application/json",
      ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
      ...(headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error(`Google Maps request was denied (403): ${body}`);
    }
    throw new Error(`Google Maps request failed [${res.status}]: ${body}`);
  }
  return res.json();
}

const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.currentOpeningHours.openNow",
  "places.currentOpeningHours.weekdayDescriptions",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.photos",
  "places.types",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.editorialSummary",
].join(",");

type RawPlace = Record<string, any>;

export function normalizePlace(p: RawPlace): Hospital {
  const photos: string[] = Array.isArray(p.photos)
    ? p.photos.map((ph: RawPlace) => ph.name).filter(Boolean)
    : [];
  return {
    id: p.id,
    name: p.displayName?.text ?? "Unnamed place",
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    rating: typeof p.rating === "number" ? p.rating : null,
    userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    openNow:
      typeof p.currentOpeningHours?.openNow === "boolean"
        ? p.currentOpeningHours.openNow
        : null,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    photoName: photos[0] ?? null,
    photoNames: photos.slice(0, 6),
    types: Array.isArray(p.types) ? p.types : [],
    businessStatus: p.businessStatus ?? null,
    weekdayHours: p.currentOpeningHours?.weekdayDescriptions ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
    editorialSummary: p.editorialSummary?.text ?? null,
  };
}

export async function searchTextPlaces(opts: {
  textQuery: string;
  center?: LatLng;
  radius?: number;
  openNow?: boolean;
  maxResults?: number;
  pages?: number;
}): Promise<Hospital[]> {
  const out: Hospital[] = [];
  let pageToken: string | undefined;
  const pages = Math.max(1, Math.min(opts.pages ?? 1, 3));
  for (let i = 0; i < pages; i++) {
    const body: Record<string, unknown> = {
      textQuery: opts.textQuery,
      includedType: "hospital",
      maxResultCount: Math.min(opts.maxResults ?? 20, 20),
      regionCode: "IN",
    };
    if (opts.openNow) body.openNow = true;
    if (opts.center) {
      body.locationBias = {
        circle: {
          center: { latitude: opts.center.lat, longitude: opts.center.lng },
          radius: Math.min(Math.max(opts.radius ?? 5000, 500), 50000),
        },
      };
    }
    if (pageToken) body.pageToken = pageToken;
    const json = await gateway("/places/v1/places:searchText", {
      method: "POST",
      body: JSON.stringify(body),
      fieldMask: `${PLACE_FIELDS},nextPageToken`,
    });
    for (const p of json.places ?? []) out.push(normalizePlace(p));
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

export async function searchNearbyHospitals(opts: {
  center: LatLng;
  radius: number;
  maxResults?: number;
}): Promise<Hospital[]> {
  const json = await gateway("/places/v1/places:searchNearby", {
    method: "POST",
    body: JSON.stringify({
      includedTypes: ["hospital"],
      maxResultCount: Math.min(opts.maxResults ?? 20, 20),
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: opts.center.lat, longitude: opts.center.lng },
          radius: Math.min(Math.max(opts.radius, 500), 50000),
        },
      },
    }),
    fieldMask: PLACE_FIELDS,
  });
  return (json.places ?? []).map(normalizePlace);
}

export async function placeDetails(placeId: string): Promise<Hospital> {
  const fields = PLACE_FIELDS.replaceAll("places.", "");
  const json = await gateway(`/places/v1/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    fieldMask: fields,
  });
  return normalizePlace(json);
}

export async function geocodeAddress(address: string) {
  const json = await gateway(
    `/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=in&components=country:IN`,
    { method: "GET" },
  );
  const first = json.results?.[0];
  if (!first) return null;
  return {
    label: first.formatted_address as string,
    lat: first.geometry.location.lat as number,
    lng: first.geometry.location.lng as number,
  };
}

export async function reverseGeocode(point: LatLng) {
  const json = await gateway(
    `/maps/api/geocode/json?latlng=${point.lat},${point.lng}&region=in`,
    { method: "GET" },
  );
  return (json.results?.[0]?.formatted_address as string | undefined) ?? null;
}

export async function travelMatrix(origin: LatLng, destinations: LatLng[]) {
  if (destinations.length === 0) return [];
  const chunks: LatLng[][] = [];
  for (let i = 0; i < destinations.length; i += 25) chunks.push(destinations.slice(i, i + 25));
  const results: { index: number; distanceMeters: number | null; seconds: number | null }[] = [];
  let offset = 0;
  for (const chunk of chunks) {
    try {
      const json = await gateway("/routes/distanceMatrix/v2:computeRouteMatrix", {
        method: "POST",
        body: JSON.stringify({
          origins: [
            {
              waypoint: {
                location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
              },
            },
          ],
          destinations: chunk.map((d) => ({
            waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
          })),
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
        fieldMask: "originIndex,destinationIndex,duration,distanceMeters,condition",
      });
      for (const row of json ?? []) {
        results.push({
          index: offset + (row.destinationIndex ?? 0),
          distanceMeters:
            row.condition === "ROUTE_EXISTS" && typeof row.distanceMeters === "number"
              ? row.distanceMeters
              : null,
          seconds:
            row.condition === "ROUTE_EXISTS" && typeof row.duration === "string"
              ? Number(row.duration.replace("s", ""))
              : null,
        });
      }
    } catch {
      // routing unavailable for this chunk — leave values null
    }
    offset += chunk.length;
  }
  return results;
}

const AP_QUERIES = [
  "hospitals in Visakhapatnam Andhra Pradesh",
  "hospitals in Vijayawada Andhra Pradesh",
  "hospitals in Guntur Andhra Pradesh",
  "hospitals in Tirupati Andhra Pradesh",
  "hospitals in Nellore Andhra Pradesh",
  "hospitals in Kurnool Andhra Pradesh",
  "hospitals in Rajahmundry Andhra Pradesh",
  "hospitals in Kakinada Andhra Pradesh",
];

export async function andhraPradeshHospitals() {
  const seen = new Map<string, Hospital>();
  const batches = await Promise.all(
    AP_QUERIES.map((q) =>
      searchTextPlaces({ textQuery: q, pages: 1, maxResults: 20 }).catch(() => [] as Hospital[]),
    ),
  );
  for (const batch of batches) for (const h of batch) seen.set(h.id, h);
  return {
    count: seen.size,
    citiesScanned: AP_QUERIES.length,
    sample: [...seen.values()]
      .filter((h) => h.rating != null)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6),
  };
}
