import { Link } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Navigation,
  Clock,
  Phone,
  Ambulance,
  Building2,
  ImageOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UNAVAILABLE,
  formatDistance,
  formatDuration,
  hospitalKind,
  looksEmergency,
  photoUrl,
  type Hospital,
  type LatLng,
} from "@/lib/hospital-types";

export function HospitalCard({
  hospital,
  origin,
  onHover,
  active,
}: {
  hospital: Hospital;
  origin: LatLng & { label: string };
  onHover?: (id: string) => void;
  active?: boolean;
}) {
  const photo = photoUrl(hospital.photoName, 600);
  const directions =
    hospital.lat != null && hospital.lng != null
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${hospital.lat},${hospital.lng}&travelmode=driving`
      : (hospital.googleMapsUri ?? null);

  return (
    <article
      onMouseEnter={() => onHover?.(hospital.id)}
      className={`surface-card overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)] ${
        active ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-44 w-full shrink-0 bg-muted sm:h-auto sm:w-44">
          {photo ? (
            <img
              src={photo}
              alt={`${hospital.name} photo`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-36 w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
              <span className="px-2 text-center text-[11px]">{UNAVAILABLE}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold leading-tight">{hospital.name}</h3>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                <span>{hospital.address ?? UNAVAILABLE}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Star className="size-4 fill-[var(--color-rating)] text-[var(--color-rating)]" aria-hidden />
              {hospital.rating != null ? (
                <span>
                  {hospital.rating.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({hospital.userRatingCount ?? 0} reviews)
                  </span>
                </span>
              ) : (
                <span className="text-xs font-normal text-muted-foreground">{UNAVAILABLE}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="gap-1">
              <Navigation className="size-3 text-info" aria-hidden />
              {formatDistance(hospital.distanceMeters)}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3 text-primary" aria-hidden />
              {formatDuration(hospital.durationSeconds)}
            </Badge>
            {hospital.openNow == null ? (
              <Badge variant="outline">Open status: {UNAVAILABLE}</Badge>
            ) : hospital.openNow ? (
              <Badge className="bg-[var(--color-success-soft)] text-[var(--color-success)]">
                Open now
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Closed
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Building2 className="size-3 text-primary" aria-hidden />
              {hospitalKind(hospital)}
            </Badge>
            {looksEmergency(hospital) ? (
              <Badge className="gap-1 bg-[var(--color-emergency-soft)] text-[var(--color-emergency)]">
                <Ambulance className="size-3" aria-hidden />
                Emergency care listed
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hospital.phone ? (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a href={`tel:${hospital.phone.replace(/\s/g, "")}`}>
                  <Phone className="size-4 text-success" aria-hidden />
                  {hospital.phone}
                </a>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Phone: {UNAVAILABLE}</span>
            )}
            {directions ? (
              <Button asChild size="sm" variant="secondary" className="gap-1.5">
                <a href={directions} target="_blank" rel="noreferrer">
                  <Navigation className="size-4 text-info" aria-hidden />
                  Navigate
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" className="ml-auto">
              <Link
                to="/hospital/$placeId"
                params={{ placeId: hospital.id }}
                search={{ lat: origin.lat, lng: origin.lng, label: origin.label }}
              >
                View details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
