"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (point: { latitude: string; longitude: string }) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  useEffect(() => {
    if (!node.current || map.current) return;
    const instance = new maplibregl.Map({
      container: node.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [69.2797, 41.3111],
      zoom: 10,
    });
    instance.addControl(new maplibregl.NavigationControl(), "bottom-right");
    instance.on("click", (event) =>
      onChange({
        latitude: event.lngLat.lat.toFixed(6),
        longitude: event.lngLat.lng.toFixed(6),
      }),
    );
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [onChange]);
  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!map.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    marker.current?.remove();
    marker.current = new maplibregl.Marker({ color: "#623bff" })
      .setLngLat([lng, lat])
      .addTo(map.current);
    map.current.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.current.getZoom(), 14),
      essential: true,
    });
  }, [latitude, longitude]);
  return (
    <div className="admin-location-picker">
      <div ref={node} />
      <p>
        Xaritada kerakli joyni bosing — latitude va longitude avtomatik to‘ladi.
      </p>
    </div>
  );
}
