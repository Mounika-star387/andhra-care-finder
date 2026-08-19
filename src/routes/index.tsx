import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Building2,
  Star,
  Ambulance,
  Clock,
  Stethoscope,
  ShieldAlert,
  IndianRupee,
} from "lucide-react";
import heroArt from "@/assets/hospital-hero.png";
import { SiteHeader } from "@/components/SiteHeader";
import { LocationPicker } from "@/components/LocationPicker";
import { VoiceSearch } from "@/components/VoiceSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getApOverview } from "@/lib/maps.functions";
import { readLocation, type SavedLocation } from "@/lib/location-store";
import { UNAVAILABLE, parseVoiceCommand } from "@/lib/hospital-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find Hospitals Near You in Andhra Pradesh | MediFind AP" },
      {
        name: "description",
        content:
          "Find nearby hospitals in Andhra Pradesh with live distance, travel time, ratings, opening hours and emergency assistance.",
      },
      { property: "og:title", content: "Find Hospitals Near You in Andhra Pradesh" },
      {
        property: "og:description",
        content:
          "Live hospital search with distance, travel time, ratings and emergency assistance across Andhra Pradesh.",
      },
    ],
  }),
  component: HomePage,
});

const QUICK_FILTERS = [
  { label: "Emergency hospitals", icon: Ambulance, tone: "text-emergency", q: "emergency hospital" },
  { label: "Government hospitals", icon: Building2, tone: "text-info", q: "government hospital" },
  { label: "Private hospitals", icon: Stethoscope, tone: "text-primary", q: "private hospital" },
  { label: "Open now", icon: Clock, tone: "text-success", q: "hospital open now" },
];

function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5000);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLocation(readLocation());
  }, []);

  const apFn = useServerFn(getApOverview);
  const ap = useQuery({
    queryKey: ["ap-overview"],
    queryFn: () => apFn({}),
    staleTime: 10 * 60 * 1000,
  });

  const runSearch = (text: string, extra?: { radius?: number; openNow?: boolean }) => {
    if (!location) {
      setNotice("Please set your location first — use “Use My Location” or enter a city/pincode.");
      return;
    }
    navigate({
      to: "/results",
      search: {
        lat: location.lat,
        lng: location.lng,
        label: location.label,
        q: text.trim() || undefined,
        radius: extra?.radius ?? radius,
        openNow: extra?.openNow ? true : undefined,
        sort: "distance",
      },
    });
  };

  const handleVoice = (text: string) => {
    const parsed = parseVoiceCommand(text);
    setQuery(parsed.query);
    runSearch(parsed.query, {
      radius: parsed.radiusKm ? Math.round(parsed.radiusKm * 1000) : radius,
      openNow: parsed.openNow,
    });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="hero-gradient">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <ShieldAlert className="size-3.5 text-emergency" aria-hidden />
              Live data from Google Places — nothing is invented
            </Badge>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Find Hospitals Near You</h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Find nearby hospitals, distance, travel time, availability and emergency assistance in
              one place.
            </p>

            <div className="mt-6 space-y-4">
              <LocationPicker
                location={location}
                onChange={(loc) => {
                  setLocation(loc);
                  setNotice(null);
                }}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(query);
                }}
                className="surface-card flex flex-col gap-3 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary"
                      aria-hidden
                    />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search hospitals, areas or services…"
                      aria-label="Search hospitals, areas or services"
                      className="h-14 rounded-xl pl-11 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 px-8 text-base">
                    Search
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <VoiceSearch onResult={handleVoice} onTranscript={setQuery} />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Search radius
                    <select
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {[2000, 5000, 10000, 20000, 50000].map((r) => (
                        <option key={r} value={r}>
                          {r / 1000} km
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_FILTERS.map((f) => (
                    <Button
                      key={f.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() =>
                        runSearch(f.q, { openNow: f.label === "Open now" || undefined })
                      }
                    >
                      <f.icon className={`size-4 ${f.tone}`} aria-hidden />
                      {f.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => runSearch("affordable hospital")}
                  >
                    <IndianRupee className="size-4 text-rating" aria-hidden />
                    Price range (when listed)
                  </Button>
                </div>

                {notice ? <p className="text-sm text-destructive">{notice}</p> : null}
              </form>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <img
              src={heroArt}
              alt="Illustration of a hospital, ambulance and medical staff with a location pin"
              width={1024}
              height={768}
              className="mx-auto w-full max-w-md"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="surface-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Andhra Pradesh hospital overview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Counted live from Google Places results across major Andhra Pradesh cities. This
                  is the number of hospitals returned by the live search, not an official registry
                  total.
                </p>
              </div>
              {ap.isLoading ? (
                <Skeleton className="h-16 w-40" />
              ) : ap.isError ? (
                <p className="text-sm text-destructive">
                  Live hospital data could not be loaded right now.
                </p>
              ) : (
                <div className="text-right">
                  <p className="font-display text-4xl font-bold text-primary">{ap.data?.count}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Hospitals found in Andhra Pradesh
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    across {ap.data?.citiesScanned} major cities scanned
                  </p>
                </div>
              )}
            </div>

            {ap.isLoading ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : ap.data?.sample?.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ap.data.sample.map((h) => (
                  <div key={h.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-sm font-medium leading-tight">{h.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {h.address ?? UNAVAILABLE}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-xs">
                      <Star
                        className="size-3.5 fill-[var(--color-rating)] text-[var(--color-rating)]"
                        aria-hidden
                      />
                      {h.rating != null ? `${h.rating.toFixed(1)} (${h.userRatingCount ?? 0})` : UNAVAILABLE}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> {UNAVAILABLE}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
