import { useEffect, useRef } from "react";
import type { Hospital, LatLng } from "@/lib/hospital-types";

declare global {
  interface Window {
    google?: any;
    __initMediFindMap?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
  if (!key) return Promise.reject(new Error("Map key unavailable"));
  loaderPromise = new Promise<void>((resolve, reject) => {
    window.__initMediFindMap = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initMediFindMap&channel=${channel}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export default function HospitalMap({
  center,
  hospitals,
  selectedId,
  onSelect,
  className,
}: {
  center: LatLng;
  hospitals: Hospital[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = window.google;
        mapRef.current ??= new g.maps.Map(ref.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const map = mapRef.current;
        map.setCenter({ lat: center.lat, lng: center.lng });

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        markersRef.current.push(
          new g.maps.Marker({
            map,
            position: { lat: center.lat, lng: center.lng },
            title: "Your location",
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          }),
        );

        const bounds = new g.maps.LatLngBounds();
        bounds.extend({ lat: center.lat, lng: center.lng });

        hospitals.forEach((h) => {
          if (h.lat == null || h.lng == null) return;
          const selected = h.id === selectedId;
          const marker = new g.maps.Marker({
            map,
            position: { lat: h.lat, lng: h.lng },
            title: h.name,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: selected ? 11 : 7,
              fillColor: selected ? "#dc2626" : "#0d9488",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            zIndex: selected ? 99 : 1,
          });
          marker.addListener("click", () => onSelect?.(h.id));
          markersRef.current.push(marker);
          bounds.extend({ lat: h.lat, lng: h.lng });
        });

        if (hospitals.length > 0) map.fitBounds(bounds, 48);
      })
      .catch(() => {
        /* map unavailable; caller shows fallback text */
      });
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, hospitals, selectedId, onSelect]);

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Map of nearby hospitals"
      className={className}
    />
  );
}
