"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Coordinates, Rec } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface MapSectionProps {
  recs: Rec[];
  center: Coordinates;
  selectedRecId: string | null;
  onSelectRec: (id: string) => void;
}

export function MapSection({ recs, center, selectedRecId, onSelectRec }: MapSectionProps) {
  if (!MAPBOX_TOKEN) {
    return <MapFallback recs={recs} selectedRecId={selectedRecId} onSelectRec={onSelectRec} />;
  }
  return <MapboxMap recs={recs} center={center} selectedRecId={selectedRecId} onSelectRec={onSelectRec} />;
}

/** Shown locally when NEXT_PUBLIC_MAPBOX_TOKEN is unset, and as a fallback if Mapbox errors (e.g. invalid token). */
function MapFallback({
  recs,
  selectedRecId,
  onSelectRec,
}: Omit<MapSectionProps, "center">) {
  return (
    <div className="h-64 w-full border-b border-zinc-200 bg-zinc-100 sm:h-80 md:h-96 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Map unavailable — {recs.length} pin{recs.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {recs.map((rec) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => onSelectRec(rec.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedRecId === rec.id
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-secondary)]"
                  : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
              }`}
            >
              {rec.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapboxMap({ recs, center, selectedRecId, onSelectRec }: MapSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef(new Map<string, mapboxgl.Marker>());
  const onSelectRecRef = useRef(onSelectRec);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    onSelectRecRef.current = onSelectRec;
  }, [onSelectRec]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 13,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("error", () => setMapFailed(true));
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is initialized once; center changes shouldn't re-mount it
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(recs.map((rec) => rec.id));
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const rec of recs) {
      if (markersRef.current.has(rec.id)) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", rec.name);
      el.className = "tuka-map-pin";
      el.addEventListener("click", () => onSelectRecRef.current(rec.id));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([rec.coordinates.lng, rec.coordinates.lat])
        .addTo(map);
      markersRef.current.set(rec.id, marker);
    }
  }, [recs]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      el.classList.toggle("tuka-map-pin--selected", id === selectedRecId);
    }
    if (selectedRecId) {
      const rec = recs.find((r) => r.id === selectedRecId);
      if (rec) {
        mapRef.current?.flyTo({ center: [rec.coordinates.lng, rec.coordinates.lat], zoom: 15 });
      }
    }
  }, [selectedRecId, recs]);

  if (mapFailed) {
    return <MapFallback recs={recs} selectedRecId={selectedRecId} onSelectRec={onSelectRec} />;
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full border-b border-zinc-200 sm:h-80 md:h-96 dark:border-zinc-800"
    />
  );
}
