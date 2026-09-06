"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Peta mini interaktif untuk modal kontak - pakai tile same-origin via
 * /api/map-tile (proxy server) sehingga tidak bisa diblokir ekstensi/setelan
 * browser. Pin dipasang persis di koordinat GPS seller saat pengajuan.
 */
export function MiniMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      L.tileLayer("/api/map-tile/{z}/{x}/{y}.png?v=2", {
        maxZoom: 19,
      }).addTo(map);
      // pin SVG presisi (icon bawaan Leaflet sering 404 & ujungnya tidak presisi)
      const icon = L.divIcon({
        className: "",
        html: '<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z" fill="#1e2a4a" stroke="#ffffff" stroke-width="2"/><circle cx="13" cy="13" r="4.5" fill="#ffffff"/></svg>',
        iconSize: [26, 34],
        iconAnchor: [13, 34],
      });
      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(label)
        .openPopup();
      setReady(true);
      // Paksa re-layout setelah transisi modal selesai (pola anti tile rusak).
      setTimeout(() => map?.invalidateSize(), 150);
      setTimeout(() => map?.invalidateSize(), 600);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, label]);

  return (
    <div className="relative h-48 w-full bg-surface">
      <div ref={ref} className="h-full w-full" />
      {!ready && (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-muted">
          Memuat peta…
        </p>
      )}
    </div>
  );
}
