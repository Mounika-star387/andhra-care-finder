import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Crosshair, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocode, reverse } from "@/lib/maps.functions";
import { saveLocation, type SavedLocation } from "@/lib/location-store";

export function LocationPicker({
  location,
  onChange,
}: {
  location: SavedLocation | null;
  onChange: (loc: SavedLocation) => void;
}) {
  const reverseFn = useServerFn(reverse);
  const geocodeFn = useServerFn(geocode);
  const [busy, setBusy] = useState<"gps" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);

  const commit = (loc: SavedLocation) => {
    saveLocation(loc);
    onChange(loc);
  };

  const useMyLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Your browser doesn't support location. Please enter your city or pincode.");
      setShowManual(true);
      return;
    }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const addr = await reverseFn({ data: { lat, lng } });
          if (addr) label = addr;
        } catch {
          /* keep coordinates as label */
        }
        setBusy(null);
        commit({ lat, lng, label });
      },
      () => {
        setBusy(null);
        setShowManual(true);
        setError("Location permission denied. Enter your city, area or pincode instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manual.trim().length < 2) return;
    setBusy("manual");
    setError(null);
    try {
      const result = await geocodeFn({ data: { query: `${manual.trim()}, India` } });
      if (!result) {
        setError("We couldn't find that place. Try a different city, area or pincode.");
      } else {
        commit(result);
      }
    } catch {
      setError("Location lookup failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={useMyLocation} disabled={busy === "gps"} className="gap-2">
          {busy === "gps" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="size-4" aria-hidden />
          )}
          Use My Location
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowManual((v) => !v)}>
          Enter location manually
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden />
          Your location is used only to find nearby hospitals and calculate distance and travel
          time. It is never stored on our servers.
        </p>
      </div>

      {showManual ? (
        <form onSubmit={submitManual} className="mt-3 flex flex-wrap gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="City, area or pincode (e.g. Vijayawada, Benz Circle, 520010)"
            className="h-11 flex-1 min-w-56"
            aria-label="City, area or pincode"
          />
          <Button type="submit" variant="secondary" disabled={busy === "manual"} className="h-11">
            {busy === "manual" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Set location"}
          </Button>
        </form>
      ) : null}

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
        <MapPin className="size-4 shrink-0 text-emergency" aria-hidden />
        <span className="font-medium">Current location:</span>
        <span className="truncate text-muted-foreground">
          {location ? location.label : "No location selected yet"}
        </span>
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
