"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export type MapPoint = { lat: number; lng: number; name: string; cat?: string };
export type MapLeg = { geometry: [number, number][]; estimated: boolean };

interface CourseMapProps {
  points: MapPoint[];
  legs: MapLeg[];
}

export default function CourseMap({ points, legs }: CourseMapProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  // init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // redraw on data change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    const pts = points.filter((p) => p.lat != null && p.lng != null);
    if (pts.length === 0) return;

    pts.forEach((p, i) => {
      const icon = L.divIcon({
        html: `<div class="pin"><span>${i + 1}</span></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const m = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b>${p.cat ? `<br>${p.cat}` : ""}`);
      layersRef.current.push(m);
    });

    legs.forEach((leg) => {
      if (!leg.geometry || leg.geometry.length < 2) return;
      const pl = L.polyline(leg.geometry, {
        color: "#6e1423",
        weight: 5,
        opacity: 0.85,
        dashArray: leg.estimated ? "6,9" : undefined,
      }).addTo(map);
      layersRef.current.push(pl);
    });

    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number]));
    const id = setTimeout(() => {
      // map may have been torn down (modal close / strict-mode remount)
      if (mapRef.current !== map) return;
      try {
        map.invalidateSize();
        if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 16);
        else map.fitBounds(bounds.pad(0.35), { maxZoom: 16 });
      } catch {
        /* container detached — ignore */
      }
    }, 120);
    return () => clearTimeout(id);
  }, [points, legs]);

  return (
    <div
      ref={elRef}
      style={{
        height: 230,
        width: "100%",
        borderRadius: 16,
        border: "1px solid var(--line)",
        zIndex: 0,
        background: "#e9e3d8",
      }}
    />
  );
}
