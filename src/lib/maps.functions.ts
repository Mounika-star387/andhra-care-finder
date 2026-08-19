import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  andhraPradeshHospitals,
  geocodeAddress,
  placeDetails,
  reverseGeocode,
  searchNearbyHospitals,
  searchTextPlaces,
  travelMatrix,
} from "./maps.server";

export const getApOverview = createServerFn({ method: "GET" }).handler(async () => {
  return andhraPradeshHospitals();
});

export const geocode = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ query: z.string().min(2).max(200) }).parse(data))
  .handler(async ({ data }) => geocodeAddress(data.query));

export const reverse = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ lat: z.number(), lng: z.number() }).parse(data))
  .handler(async ({ data }) => reverseGeocode({ lat: data.lat, lng: data.lng }));

export const findHospitals = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(50000).default(5000),
        query: z.string().max(200).optional(),
        openNow: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const center = { lat: data.lat, lng: data.lng };
    const q = data.query?.trim();
    const hospitals = q
      ? await searchTextPlaces({
          textQuery: q,
          center,
          radius: data.radius,
          openNow: data.openNow,
          pages: 2,
        })
      : await searchNearbyHospitals({ center, radius: data.radius });

    const matrix = await travelMatrix(
      center,
      hospitals.map((h) => ({ lat: h.lat ?? center.lat, lng: h.lng ?? center.lng })),
    );
    for (const row of matrix) {
      const h = hospitals[row.index];
      if (!h) continue;
      h.distanceMeters = row.distanceMeters;
      h.durationSeconds = row.seconds;
    }
    return hospitals;
  });

export const getHospital = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        placeId: z.string().min(3).max(300),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const hospital = await placeDetails(data.placeId);
    if (data.lat != null && data.lng != null && hospital.lat != null && hospital.lng != null) {
      const [row] = await travelMatrix(
        { lat: data.lat, lng: data.lng },
        [{ lat: hospital.lat, lng: hospital.lng }],
      );
      hospital.distanceMeters = row?.distanceMeters ?? null;
      hospital.durationSeconds = row?.seconds ?? null;
    }
    return hospital;
  });
