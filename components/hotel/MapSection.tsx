"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Coordinates, Rec } from "@/lib/types";
import { categoryIcon } from "@/lib/categoryIcon";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface MapSectionProps {
  recs: Rec[];
  center: Coordinates;
  hotelName: string;
  hotelLogoUrl: string;
  selectedRecId: string | null;
  onSelectRec: (id: string) => void;
}

export function MapSection(props: MapSectionProps) {
  const { recs, selectedRecId, onSelectRec } = props;
  if (!MAPBOX_TOKEN) {
    return <MapFallback recs={recs} selectedRecId={selectedRecId} onSelectRec={onSelectRec} />;
  }
  return <MapboxMap {...props} />;
}

/** Shown locally when NEXT_PUBLIC_MAPBOX_TOKEN is unset, and as a fallback if Mapbox errors (e.g. invalid token). */
function MapFallback({
  recs,
  selectedRecId,
  onSelectRec,
}: Pick<MapSectionProps, "recs" | "selectedRecId" | "onSelectRec">) {
  return (
    <div className="h-full w-full bg-zinc-100">
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium text-zinc-500">
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
                  ? "border-[var(--tuka-ink)] bg-[var(--tuka-ink)] text-white"
                  : "border-zinc-300 bg-white text-zinc-600"
              }`}
            >
              {categoryIcon(rec.category)} {rec.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildMarkerElement(rec: Rec, onSelect: (id: string) => void): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", rec.name);
  el.className = "tuka-map-marker";
  el.innerHTML = `<span class="tuka-map-marker__icon">${categoryIcon(rec.category)}</span><span class="tuka-map-marker__label">${rec.name}</span>`;
  el.addEventListener("click", () => onSelect(rec.id));
  return el;
}

function MapboxMap({ recs, center, hotelName, hotelLogoUrl, selectedRecId, onSelectRec }: MapSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef(new Map<string, mapboxgl.Marker>());
  const homeMarkerRef = useRef<mapboxgl.Marker | null>(null);
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
      zoom: 14,
      // Single-finger touch drags scroll the page instead of panning the map —
      // otherwise guests scrolling past the map on mobile get stuck panning it instead.
      cooperativeGestures: true,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("error", () => setMapFailed(true));
    mapRef.current = map;

    const homeEl = document.createElement("div");
    homeEl.className = "tuka-map-marker tuka-map-marker--home";
    const logoImg = document.createElement("img");
    logoImg.src = hotelLogoUrl;
    logoImg.alt = hotelName;
    logoImg.onerror = () => {
      // No logo file at this URL yet -- show a home-pin icon instead of a
      // broken image icon shrinking down to the bare gold circle.
      logoImg.remove();
      const fallback = document.createElement("div");
      fallback.className = "tuka-map-marker__home-fallback";
      fallback.innerHTML =
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>';
      homeEl.appendChild(fallback);
    };
    homeEl.appendChild(logoImg);
    homeMarkerRef.current = new mapboxgl.Marker({ element: homeEl })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      homeMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is initialized once; center/logo changes shouldn't re-mount it
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
      const el = buildMarkerElement(rec, (id) => onSelectRecRef.current(id));
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([rec.coordinates.lng, rec.coordinates.lat])
        .addTo(map);
      markersRef.current.set(rec.id, marker);
    }
  }, [recs]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      el.classList.toggle("tuka-map-marker--selected", id === selectedRecId);
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

  return <div ref={containerRef} className="h-full w-full" />;
}
