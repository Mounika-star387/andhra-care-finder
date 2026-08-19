import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AlertTriangle, MapPin, Loader2, Search, Hospital as HospitalIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { HospitalCard } from "@/components/HospitalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { findHospitals } from "@/lib/maps.functions";
import { readLocation, saveLocation } from "@/lib/location-store";
import {
  hospitalKind,
  looksEmergency,
  type Hospital,
} from "@/lib/hospital-types";

const HospitalMap = lazy(() => import("@/components/HospitalMap"));

type ResultsSearch = {
  lat?: number;
  lng?: number;
  label?: string;
  q?: string;
  radius: number;
  openNow?: boolean;
  sort: string;
  minRating?: number;
  ownership?: string;
  emergency?: boolean;
};

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): ResultsSearch => {
    const num = (v: unknown) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : undefined);
    return {
      lat: num(search.lat),
      lng: num(search.lng),
      label: typeof search.label === "string" ? search.label : undefined,
      q: typeof search.q === "string" && search.q ? search.q : undefined,
      radius: num(search.radius) ?? 5000,
      openNow: search.openNow === true || search.openNow === "true" ? true : undefined,
      sort: typeof search.sort === "string" ? search.sort : "distance",
      minRating: num(search.minRating),
      ownership: typeof search.ownership === "string" ? search.ownership : undefined,
      emergency: search.emergency === true || search.emergency === "true" ? true : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Nearby Hospitals — Live Results | MediFind AP" },
      {
        name: "description",
        content:
          "Browse nearby hospitals with live distance, driving time, ratings, open status and an interactive map.",
      },
      { property: "og:title", content: "Nearby Hospitals — Live Results" },
      {
        property: "og:description",
        content: "Live hospital results with distance, travel time, ratings and map view.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [text, setText] = useState(search.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (search.lat == null || search.lng == null) {
      const stored = readLocation();
      if (stored) {
        navigate({
          to: ".",
          search: (prev) => ({ ...prev, lat: stored.lat, lng: stored.lng, label: stored.label }),
          replace: true,
        });
      }
    } else if (search.label) {
      saveLocation({ lat: search.lat, lng: search.lng, label: search.label });
    }
  }, [search.lat, search.lng, search.label, navigate]);

  const origin =
    search.lat != null && search.lng != null
      ? { lat: search.lat, lng: search.lng, label: search.label ?? "Selected location" }
      : null;

  const findFn = useServerFn(findHospitals);
  const results = useQuery({
    queryKey: ["hospitals", origin?.lat, origin?.lng, search.q, search.radius, search.openNow],
    enabled: !!origin,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      findFn({
        data: {
          lat: origin!.lat,
          lng: origin!.lng,
          radius: search.radius,
          query: search.q,
          openNow: search.openNow,
        },
      }),
  });

  const hospitals = useMemo(() => {
    let list: Hospital[] = results.data ?? [];
    if (search.minRating) list = list.filter((h) => (h.rating ?? 0) >= search.minRating!);
    if (search.ownership) list = list.filter((h) => hospitalKind(h) === search.ownership);
    if (search.emergency) list = list.filter(looksEmergency);
    if (search.openNow) list = list.filter((h) => h.openNow !== false);
    const sorted = [...list];
    if (search.sort === "rating") sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    else if (search.sort === "duration")
      sorted.sort((a, b) => (a.durationSeconds ?? Infinity) - (b.durationSeconds ?? Infinity));
    else if (search.sort === "open")
      sorted.sort((a, b) => Number(b.openNow === true) - Number(a.openNow === true));
    else sorted.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    return sorted;
  }, [results.data, search.minRating, search.ownership, search.emergency, search.openNow, search.sort]);

  const update = (patch: Partial<ResultsSearch>) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }) });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-bold">Nearby Hospitals</h1>

        {!origin ? (
          <div className="surface-card mt-6 p-8 text-center">
            <MapPin className="mx-auto size-8 text-emergency" aria-hidden />
            <p className="mt-3 font-medium">No location selected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set your location on the home page to see hospitals near you.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Go to search</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1.5">
                <MapPin className="size-3.5 text-emergency" aria-hidden />
                {origin.label}
              </Badge>
              <Badge variant="outline">Radius: {search.radius / 1000} km</Badge>
              <Badge variant="outline">
                {results.isLoading ? "Searching…" : `${hospitals.length} hospitals found`}
              </Badge>
              {search.q ? <Badge variant="outline">Query: “{search.q}”</Badge> : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: text.trim() || undefined });
              }}
              className="surface-card mt-4 flex flex-col gap-3 p-4"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                    aria-hidden
                  />
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Search hospitals, areas or services…"
                    aria-label="Search hospitals"
                    className="h-11 pl-10"
                  />
                </div>
                <Button type="submit" className="h-11">
                  Search
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Select
                  label="Distance"
                  value={String(search.radius)}
                  onChange={(v) => update({ radius: Number(v) })}
                  options={[2000, 5000, 10000, 20000, 50000].map((r) => ({
                    value: String(r),
                    label: `${r / 1000} km`,
                  }))}
                />
                <Select
                  label="Sort by"
                  value={search.sort}
                  onChange={(v) => update({ sort: v })}
                  options={[
                    { value: "distance", label: "Nearest first" },
                    { value: "rating", label: "Highest rated" },
                    { value: "duration", label: "Fastest travel time" },
                    { value: "open", label: "Open now first" },
                  ]}
                />
                <Select
                  label="Minimum rating"
                  value={String(search.minRating ?? "")}
                  onChange={(v) => update({ minRating: v ? Number(v) : undefined })}
                  options={[
                    { value: "", label: "Any rating" },
                    { value: "3", label: "3.0+" },
                    { value: "4", label: "4.0+" },
                    { value: "4.5", label: "4.5+" },
                  ]}
                />
                <Select
                  label="Type"
                  value={search.ownership ?? ""}
                  onChange={(v) => update({ ownership: v || undefined })}
                  options={[
                    { value: "", label: "All hospitals" },
                    { value: "Government", label: "Government" },
                    { value: "Private", label: "Private" },
                  ]}
                />
                <Select
                  label="Availability"
                  value={search.openNow ? "open" : search.emergency ? "emergency" : ""}
                  onChange={(v) =>
                    update({
                      openNow: v === "open" ? true : undefined,
                      emergency: v === "emergency" ? true : undefined,
                    })
                  }
                  options={[
                    { value: "", label: "Any" },
                    { value: "open", label: "Open now" },
                    { value: "emergency", label: "Emergency services" },
                  ]}
                />
              </div>
            </form>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                {results.isLoading ? (
                  [0, 1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
                ) : results.isError ? (
                  <div className="surface-card p-6 text-center">
                    <AlertTriangle className="mx-auto size-8 text-destructive" aria-hidden />
                    <p className="mt-2 font-medium">Live hospital data couldn&apos;t be loaded</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(results.error as Error)?.message ?? "Please try again."}
                    </p>
                    <Button className="mt-4" onClick={() => results.refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : hospitals.length === 0 ? (
                  <div className="surface-card p-8 text-center">
                    <HospitalIcon className="mx-auto size-8 text-primary" aria-hidden />
                    <p className="mt-2 font-medium">No hospitals matched your filters</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a larger radius or fewer filters.
                    </p>
                  </div>
                ) : (
                  hospitals.map((h) => (
                    <HospitalCard
                      key={h.id}
                      hospital={h}
                      origin={origin}
                      active={h.id === selectedId}
                      onHover={setSelectedId}
                    />
                  ))
                )}
              </div>

              <div className="lg:sticky lg:top-20 lg:h-[70vh]">
                <div className="surface-card h-80 overflow-hidden lg:h-full">
                  <ClientOnly
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Loading map…
                      </div>
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Loading map…
                        </div>
                      }
                    >
                      <HospitalMap
                        className="h-full w-full"
                        center={{ lat: origin.lat, lng: origin.lng }}
                        hospitals={hospitals}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                      />
                    </Suspense>
                  </ClientOnly>
                </div>
                {selectedId ? (
                  <div className="surface-card mt-3 p-3 text-sm">
                    <p className="font-medium">
                      {hospitals.find((h) => h.id === selectedId)?.name}
                    </p>
                    <Button asChild size="sm" className="mt-2">
                      <Link
                        to="/hospital/$placeId"
                        params={{ placeId: selectedId }}
                        search={{ lat: origin.lat, lng: origin.lng, label: origin.label }}
                      >
                        View hospital details
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
