import { createFileRoute, Link, useNavigate, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, lazy, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  Building2,
  Clock,
  Globe,
  ImageOff,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Star,
  Stethoscope,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getHospital } from "@/lib/maps.functions";
import { readLocation } from "@/lib/location-store";
import {
  UNAVAILABLE,
  formatDistance,
  formatDuration,
  hospitalKind,
  looksEmergency,
  photoUrl,
} from "@/lib/hospital-types";

const HospitalMap = lazy(() => import("@/components/HospitalMap"));

type DetailSearch = { lat?: number; lng?: number; label?: string };

export const Route = createFileRoute("/hospital/$placeId")({
  validateSearch: (search: Record<string, unknown>): DetailSearch => {
    const num = (v: unknown) =>
      Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : undefined;
    return {
      lat: num(search.lat),
      lng: num(search.lng),
      label: typeof search.label === "string" ? search.label : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Hospital Details & Emergency Assistance | MediFind AP" },
      {
        name: "description",
        content:
          "Hospital details with opening hours, phone, services, directions and emergency assistance options in Andhra Pradesh.",
      },
      { property: "og:title", content: "Hospital Details & Emergency Assistance" },
      {
        property: "og:description",
        content:
          "Live hospital details: hours, phone, distance, travel time, directions and emergency options.",
      },
    ],
  }),
  component: HospitalDetailPage,
});

function HospitalDetailPage() {
  const { placeId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [ambulanceOpen, setAmbulanceOpen] = useState(false);

  useEffect(() => {
    if (search.lat == null || search.lng == null) {
      const stored = readLocation();
      if (stored) {
        navigate({
          to: ".",
          search: () => ({ lat: stored.lat, lng: stored.lng, label: stored.label }),
          replace: true,
        });
      }
    }
  }, [search.lat, search.lng, navigate]);

  const getFn = useServerFn(getHospital);
  const query = useQuery({
    queryKey: ["hospital", placeId, search.lat, search.lng],
    staleTime: 5 * 60 * 1000,
    queryFn: () => getFn({ data: { placeId, lat: search.lat, lng: search.lng } }),
  });

  const h = query.data;
  const photos = (h?.photoNames ?? []).map((n) => photoUrl(n, 900)).filter(Boolean) as string[];
  const directions =
    h?.lat != null && h?.lng != null
      ? `https://www.google.com/maps/dir/?api=1${
          search.lat != null && search.lng != null ? `&origin=${search.lat},${search.lng}` : ""
        }&destination=${h.lat},${h.lng}&travelmode=driving`
      : (h?.googleMapsUri ?? null);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 gap-1.5">
          <Link to="/results" search={{ lat: search.lat, lng: search.lng, label: search.label }}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to nearby hospitals
          </Link>
        </Button>

        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : query.isError || !h ? (
          <div className="surface-card p-8 text-center">
            <AlertTriangle className="mx-auto size-8 text-destructive" aria-hidden />
            <p className="mt-2 font-medium">Hospital information couldn&apos;t be loaded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(query.error as Error)?.message ?? UNAVAILABLE}
            </p>
            <Button className="mt-4" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="surface-card overflow-hidden">
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {photos.slice(0, 6).map((src, i) => (
                      <img
                        key={src}
                        src={src}
                        alt={`${h.name} photo ${i + 1}`}
                        loading={i === 0 ? "eager" : "lazy"}
                        className={`h-40 w-full object-cover ${i === 0 ? "col-span-2 h-56 sm:col-span-3" : ""}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                    <ImageOff className="size-7" aria-hidden />
                    <span className="text-sm">Photos: {UNAVAILABLE}</span>
                  </div>
                )}

                <div className="space-y-3 p-5">
                  <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{h.name}</h1>
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                    {h.address ?? UNAVAILABLE}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="gap-1">
                      <Star
                        className="size-3.5 fill-[var(--color-rating)] text-[var(--color-rating)]"
                        aria-hidden
                      />
                      {h.rating != null
                        ? `${h.rating.toFixed(1)} · ${h.userRatingCount ?? 0} reviews`
                        : UNAVAILABLE}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Navigation className="size-3.5 text-info" aria-hidden />
                      {formatDistance(h.distanceMeters)}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="size-3.5 text-primary" aria-hidden />
                      {formatDuration(h.durationSeconds)}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="size-3.5 text-primary" aria-hidden />
                      {hospitalKind(h)}
                    </Badge>
                    {h.openNow == null ? (
                      <Badge variant="outline">Open status: {UNAVAILABLE}</Badge>
                    ) : h.openNow ? (
                      <Badge className="bg-[var(--color-success-soft)] text-[var(--color-success)]">
                        Open now
                      </Badge>
                    ) : (
                      <Badge variant="outline">Closed now</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {h.phone ? (
                      <Button asChild className="gap-1.5">
                        <a href={`tel:${h.phone.replace(/\s/g, "")}`}>
                          <Phone className="size-4" aria-hidden />
                          Call hospital
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline">Phone: {UNAVAILABLE}</Badge>
                    )}
                    {directions ? (
                      <Button asChild variant="secondary" className="gap-1.5">
                        <a href={directions} target="_blank" rel="noreferrer">
                          <Navigation className="size-4 text-info" aria-hidden />
                          Get directions to hospital
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline">Directions: {UNAVAILABLE}</Badge>
                    )}
                    {h.website ? (
                      <Button asChild variant="outline" className="gap-1.5">
                        <a href={h.website} target="_blank" rel="noreferrer">
                          <Globe className="size-4 text-info" aria-hidden />
                          Website
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline">Website: {UNAVAILABLE}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <section className="surface-card p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Clock className="size-4 text-primary" aria-hidden />
                    Opening hours
                  </h2>
                  {h.weekdayHours?.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {h.weekdayHours.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{UNAVAILABLE}</p>
                  )}
                </section>

                <section className="surface-card p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Stethoscope className="size-4 text-primary" aria-hidden />
                    Services &amp; type
                  </h2>
                  {h.types.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {h.types.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t.replaceAll("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{UNAVAILABLE}</p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {h.editorialSummary ?? `Description: ${UNAVAILABLE}`}
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Emergency availability: </span>
                    {looksEmergency(h)
                      ? "Emergency/casualty care is listed for this hospital. Confirm by phone before travelling."
                      : UNAVAILABLE}
                  </p>
                </section>
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface-card h-72 overflow-hidden">
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
                      center={{
                        lat: search.lat ?? h.lat ?? 16.5062,
                        lng: search.lng ?? h.lng ?? 80.648,
                      }}
                      hospitals={[h]}
                      selectedId={h.id}
                    />
                  </Suspense>
                </ClientOnly>
              </div>

              <section className="rounded-xl border-2 border-[var(--color-emergency)] bg-[var(--color-emergency-soft)] p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-emergency)]">
                  <Ambulance className="size-5" aria-hidden />
                  Emergency assistance
                </h2>
                <p className="mt-2 flex items-start gap-2 text-sm font-medium">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-emergency)]" aria-hidden />
                  If this is a life-threatening emergency, contact emergency services immediately.
                </p>

                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    className="w-full text-base"
                    onClick={() => setAmbulanceOpen(true)}
                  >
                    🚑 REQUEST AMBULANCE
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full gap-2">
                    <a href="tel:112">
                      <Phone className="size-4 text-[var(--color-emergency)]" aria-hidden />
                      Call Emergency Services (112)
                    </a>
                  </Button>
                  {directions ? (
                    <Button asChild variant="secondary" size="lg" className="w-full gap-2">
                      <a href={directions} target="_blank" rel="noreferrer">
                        <Navigation className="size-4 text-info" aria-hidden />
                        Get Directions to Hospital
                      </a>
                    </Button>
                  ) : null}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  No ambulance provider is connected to this app, so ambulance availability and
                  dispatch cannot be shown. Requests are placed by calling the official emergency
                  numbers.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={ambulanceOpen} onOpenChange={setAmbulanceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ambulance className="size-5 text-[var(--color-emergency)]" aria-hidden />
              Confirm ambulance request
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Ambulance service depends on real local providers. This app is not connected to an
                  ambulance dispatch provider, so it cannot dispatch or track a vehicle and will
                  never claim one has been sent.
                </p>
                <p>
                  Confirming will start a phone call to <strong>108</strong>, the government
                  ambulance and emergency medical service number for India. You can also call the
                  hospital directly
                  {h?.phone ? ` on ${h.phone}` : ""}.
                </p>
                <p className="font-medium text-[var(--color-emergency)]">
                  If this is a life-threatening emergency, contact emergency services immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href="tel:108" className="gap-2">
                Call 108 for an ambulance
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
