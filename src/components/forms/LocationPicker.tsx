"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crosshair, Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Peta interaktif: pin selalu di TENGAH peta (crosshair). Geser = pilih titik. */
function MapPicker({
  target,
  accuracy,
  locating,
  fineTune,
  onPick,
  onLocate,
}: {
  /** koordinat yang harus dituju peta (dari tombol lokasiku); null = biarkan */
  target: { lat: number; lng: number; zoom?: number } | null;
  accuracy?: number | null;
  locating?: boolean;
  /** true = akurasi GPS kasar -> otomatis satelit + zoom jalan supaya user koreksi presisi */
  fineTune?: boolean;
  onPick: (lat: number, lng: number) => void;
  onLocate: () => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const layersRef = useRef<{ osm: any; sat: any; map: any } | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    let resize: () => void = () => {};
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      const map = L.map(divRef.current, { center: [-2.5, 118], zoom: 4, zoomControl: false });
      const osmLayer = L.tileLayer("/api/map-tile/{z}/{x}/{y}.png?v=2", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      });
      const satLayer = L.tileLayer("/api/map-tile/{z}/{x}/{y}?src=esri", {
        attribution: "Imagery &copy; Esri",
        maxZoom: 19,
      });
      osmLayer.addTo(map);
      layersRef.current = { osm: osmLayer, sat: satLayer, map };
      mapCenterRef.current = { lat: map.getCenter().lat, lng: map.getCenter().lng };
      L.control.layers(
        { "🗺️ Peta": osmLayer, "🛰️ Satelit": satLayer },
        {},
        { position: "bottomleft" }
      ).addTo(map);
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      // lingkaran akurasi mengikuti tengah peta (penunjuk = crosshair)
      const syncCircle = () => {
        const c = map.getCenter();
        if (circleRef.current) circleRef.current.setLatLng([c.lat, c.lng]);
        mapCenterRef.current = { lat: c.lat, lng: c.lng };
      };
      map.on("move", syncCircle);

      map.on("moveend", () => {
        const c = map.getCenter();
        onPickRef.current(c.lat, c.lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        map.setView([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 15), { animate: true });
      });
      mapRef.current = map;

      const doResize = () => map.invalidateSize();
      resize = doResize;
      setTimeout(doResize, 150);
      setTimeout(doResize, 600);
      window.addEventListener("resize", doResize);
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  // lingkaran akurasi GPS
  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (accuracy != null && accuracy > 0) {
        const c = map.getCenter();
        if (circleRef.current) {
          circleRef.current.setLatLng([c.lat, c.lng]).setRadius(accuracy);
        } else {
          circleRef.current = L.circle([c.lat, c.lng], {
            radius: accuracy,
            color: "#2563eb",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
          }).addTo(map);
        }
      } else if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    })();
  }, [accuracy]);

  // fine-tune: akurasi GPS kasar -> otomatis pindah ke satelit + zoom jalan (zoom 18)
  useEffect(() => {
    if (!fineTune || !layersRef.current) return;
    const { osm, sat, map } = layersRef.current;
    try {
      map.removeLayer(osm);
    } catch {
      /* sudah tidak aktif */
    }
    sat.addTo(map);
    map.setView(map.getCenter(), 18, { animate: true });
  }, [fineTune]);

  // terbang ke target (dari tombol lokasiku)
  useEffect(() => {
    (async () => {
      if (!target || !mapRef.current) return;
      const map = mapRef.current;
      map.setView([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 16), { animate: true });
    })();
  }, [target]);

  return (
    <div className="relative">
      <div
        ref={divRef}
        className="h-72 w-full overflow-hidden rounded-xl border border-line"
        aria-label="Peta pilih lokasi"
      />
      {/* crosshair tengah: posisi pin = titik tengah peta */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[600] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="5" fill="none" stroke="#d32f2f" strokeWidth="2" />
          <line x1="14" y1="0" x2="14" y2="9" stroke="#d32f2f" strokeWidth="2" />
          <line x1="14" y1="19" x2="14" y2="28" stroke="#d32f2f" strokeWidth="2" />
          <line x1="0" y1="14" x2="9" y2="14" stroke="#d32f2f" strokeWidth="2" />
          <line x1="19" y1="14" x2="28" y2="14" stroke="#d32f2f" strokeWidth="2" />
        </svg>
      </div>
      {locating && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[600] flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Mencari posisi presisi...
        </div>
      )}
      {/* Tombol lokasiku (ala Google Maps) */}
      <button
        type="button"
        onClick={onLocate}
        aria-label={locating ? "Batalkan pencarian lokasi" : "Kunci posisi saat ini"}
        title={locating ? "Batalkan pencarian lokasi" : "Kunci posisi saat ini (GPS)"}
        className={cn(
          "absolute bottom-12 right-3 z-[700] flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition active:scale-95",
          locating
            ? "border-brand/30 bg-brand text-white"
            : "border-line bg-white text-navy hover:bg-surface"
        )}
      >
        {locating ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Crosshair className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

interface Props {
  country: string;
  city: string;
  onCountry: (value: string) => void;
  onCity: (value: string) => void;
  /** Dipanggil dengan koordinat terpilih (disimpan ke produk). */
  onCoordinates?: (latitude: number, longitude: number) => void;
  error?: string;
}

interface Resolved {
  country: string;
  city: string;
  detail?: string | null;
}

/**
 * Pemilih lokasi ala aplikasi peta modern:
 * - Pin selalu di tengah peta (crosshair) - geser peta = memilih titik.
 * - Tombol lokasiku di kanan-bawah peta: kunci posisi GPS perangkat.
 * - Negara & kota terisi otomatis via reverse geocoding server-side.
 */
export function LocationPicker({ country, city, onCountry, onCity, onCoordinates, error }: Props) {
  const toast = useToast();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [target, setTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [fineTune, setFineTune] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; label: string }>>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  function runSearch(q: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        let url = `/api/geocode/search?q=${encodeURIComponent(q.trim())}`;
        const c = mapCenterRef.current;
        if (c) url += `&lat=${c.lat.toFixed(5)}&lng=${c.lng.toFixed(5)}`;
        const res = await fetch(`${url}&v=3`, { cache: "no-store" });
        const data = (await res.json()) as { results: Array<{ lat: number; lng: number; label: string }> };
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function chooseSearchResult(r: { lat: number; lng: number; label: string }) {
    setSearchResults([]);
    setSearchQ(r.label);
    setFineTune(false);
    setTarget({ lat: r.lat, lng: r.lng, zoom: 18 });
    void applyCoords(r.lat, r.lng, true);
  }
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestAccRef = useRef(Infinity);
  const lastImproveRef = useRef(0);

  const stopWatch = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => stopWatch, []);

  async function reverseGeocode(lat: number, lon: number) {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`geocode ${res.status}`);
    const loc = (await res.json()) as { country: string; city: string };
    if (!loc.country && !loc.city) throw new Error("geocode kosong");
    return loc;
  }

  /** Simpan koordinat + isi negara/kota otomatis. */
  async function applyCoords(lat: number, lng: number, announce: boolean) {
    setPicked({ lat, lng });
    onCoordinates?.(lat, lng);
    try {
      const loc = await reverseGeocode(lat, lng);
      if (loc.country) {
        const match = COUNTRIES.find((c) => c.toLowerCase() === loc.country.toLowerCase());
        onCountry(match ?? loc.country);
      }
      if (loc.city) onCity(loc.city);
      setResolved(loc);
      if (announce) {
        toast.success(
          `Lokasi terkunci: ${[loc.city, loc.country].filter(Boolean).join(", ")}.`,
          { title: "Posisi saat ini ditemukan" }
        );
      }
    } catch {
      if (announce) {
        toast.info("Koordinat tersimpan. Nama negara/kota gagal diisi otomatis - silakan isi manual.");
      }
    }
  }

  /** Tombol lokasiku: pantau GPS sampai fix terbaik, lalu kunci. */
  function locateMe() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error("Perangkat tidak mendukung GPS. Geser peta ke lokasimu ya.");
      return;
    }
    if (locating) {
      // sedang mencari -> klik lagi = batalkan
      stopWatch();
      setLocating(false);
      toast.info("Pencarian lokasi dibatalkan.");
      return;
    }
    setLocating(true);
    setAccuracy(null);
    bestAccRef.current = Infinity;
    lastImproveRef.current = Date.now();

    const finish = () => {
      stopWatch();
      setLocating(false);
    };

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setAccuracy(acc);
        // fix pertama SELALU diabaikan sebagai final (sering cache Wi-Fi) - hanya progres
        if (acc < bestAccRef.current) {
          const isFirst = bestAccRef.current === Infinity;
          bestAccRef.current = acc;
          lastImproveRef.current = Date.now();
          const zoom =
            acc <= 25 ? 18 : acc <= 60 ? 17 : acc <= 200 ? 16 : acc <= 1000 ? 15 : 14;
          setTarget({ lat: latitude, lng: longitude, zoom });
          void applyCoords(latitude, longitude, false);
          if (isFirst) return; // jangan kunci di fix pertama walau "akhirnya" - tunggu GPS menyelesaikan
        }
        // cukup presisi atau sudah lama tidak membaik -> kunci
        const improvedRecently = Date.now() - lastImproveRef.current < 4000;
        if (acc <= 30 || !improvedRecently) {
          finish();
          if (acc > 30) {
            setFineTune(true);
            toast.info(
              `Akurasi ±${Math.round(acc)} m - peta pindah ke satelit. Geser sampai crosshair tepat di titikmu.`,
              { title: "Posisi terkunci" }
            );
          }
        }
      },
      (err) => {
        finish();
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Izin lokasi ditolak. Geser peta ke lokasimu ya.");
        } else {
          toast.error("GPS sinyal lemah. Coba lagi atau geser peta manual.");
        }
      },
      // maximumAge: 0 - WAJIB. Angka selain 0 membolehkan browser memakai posisi cache (stale).
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    timerRef.current = setTimeout(() => {
      if (watchRef.current !== null) {
        finish();
        const best = bestAccRef.current;
        if (Number.isFinite(best) && best < Infinity && best > 30) {
          setFineTune(true);
          toast.info(
            `Akurasi ±${Math.round(best)} m - peta pindah ke satelit. Geser sampai crosshair tepat di titikmu.`
          );
        }
      }
    }, 15000);
  }

  // AUTO: deteksi sekali saat halaman dibuka - satu fix fresh langsung (perilaku terbukti
  // akurat di desktop), maximumAge: 0 agar bukan posisi cache.
  const autoTriedRef = useRef(false);
  useEffect(() => {
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setAccuracy(acc);
        const zoom =
          acc <= 25 ? 18 : acc <= 60 ? 17 : acc <= 200 ? 16 : acc <= 1000 ? 15 : 14;
        setTarget({ lat: latitude, lng: longitude, zoom });
        void applyCoords(latitude, longitude, false);
      },
      () => {}, // ditolak/sinyal lemah diam saja - user bisa pakai tombol 🎯
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countryOptions =
    country && !COUNTRIES.includes(country) ? [country, ...COUNTRIES] : COUNTRIES;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold">
          Negara / Lokasi <span className="text-brand">*</span>
        </label>
      </div>

      <div className="mt-2">
        {/* Pencarian alamat (ala Shopee/Google Maps): ketik alamat -> pilih -> peta terbang ke titiknya */}
        <div className="relative z-[1100] mb-2">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              void runSearch(e.target.value);
            }}
            placeholder="🔍 Cari alamat, jalan, gedung, kota..."
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/60 hover:border-navy/30 focus:border-navy focus:ring-4 focus:ring-navy/10"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">mencari...</span>
          )}
          {searchResults.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-[900] mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-xl">
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => chooseSearchResult(r)}
                    className="block w-full px-3.5 py-2 text-left text-xs leading-snug hover:bg-surface"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <MapPicker
          target={target}
          accuracy={locating || picked ? accuracy : null}
          fineTune={fineTune}
          locating={locating}
          onPick={(lat, lng) => void applyCoords(lat, lng, false)}
          onLocate={locateMe}
        />
        {/* Strip status di bawah peta */}
        {picked ? (
          <div className="mt-2.5 flex items-start justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-green-700">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Lokasi terpilih
              </p>
              {resolved?.detail && (
                <p className="mt-0.5 truncate text-sm font-semibold text-navy">{resolved.detail}</p>
              )}
              <p className="truncate text-sm font-semibold text-navy">
                {resolved && (resolved.city || resolved.country)
                  ? [resolved.city, resolved.country].filter(Boolean).join(", ")
                  : "Titik di peta"}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                <span className="tabular-nums">
                  {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
                </span>
                {accuracy != null && <> - akurasi ±{Math.round(accuracy)} m</>}
                {" - "}geser peta untuk penyesuaian halus
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`
                );
                setCopied(true);
                toast.success("Koordinat tersalin.");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted transition hover:border-navy/40 hover:text-navy"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-muted">
            Klik tombol lokasi di peta untuk mengunci posisimu, atau geser peta ke lokasimu.
          </p>
        )}
      </div>

      {/* Dropdown manual: hanya tampil otomatis bila peta belum menghasilkan titik */}
      {!picked && (
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">Negara</label>
          <p className="mt-0.5 text-xs text-muted">Terisi otomatis dari peta - bisa dikoreksi</p>
          <select
            aria-label="Negara"
            className={cn(
              "mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition",
              error
                ? "border-brand focus:border-brand focus:ring-4 focus:ring-brand/10"
                : "border-line hover:border-navy/30 focus:border-navy focus:ring-4 focus:ring-navy/10"
            )}
            value={country}
            onChange={(e) => onCountry(e.target.value)}
          >
            <option value="">Pilih negara</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold">Kota</label>
          <p className="mt-0.5 text-xs text-muted">Terisi otomatis dari peta - bisa dikoreksi</p>
          <input
            aria-label="Kota"
            className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/60 hover:border-navy/30 focus:border-navy focus:ring-4 focus:ring-navy/10"
            placeholder="Contoh: Kuala Lumpur"
            value={city}
            onChange={(e) => onCity(e.target.value)}
          />
        </div>
      </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-brand">{error}</p>}
    </div>
  );
}
