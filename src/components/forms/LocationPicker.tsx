"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";

interface Props {
  country: string;
  city: string;
  onCountry: (value: string) => void;
  onCity: (value: string) => void;
  error?: string;
}

interface Detected {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * Pemilih lokasi ala aplikasi marketplace modern (seperti Shopee):
 * - Tombol "Deteksi Otomatis" membaca GPS perangkat secara realtime
 *   (watchPosition, akurasi terus disegarkan sampai sinyal stabil).
 * - Koordinat diterjemahkan jadi nama negara & kota lewat reverse geocoding
 *   BigDataCloud (gratis, tanpa API key) lalu mengisi form otomatis.
 * - Menolak izin / GPS gagal? Tetap bisa pilih negara & kota manual.
 */
export function LocationPicker({ country, city, onCountry, onCity, error }: Props) {
  const toast = useToast();
  const [detecting, setDetecting] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [detected, setDetected] = useState<Detected | null>(null);

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestAccRef = useRef(Infinity);
  const geocodedRef = useRef(false);

  // pastikan watch & timer berhenti saat komponen dilepas
  useEffect(() => {
    return () => {
      stopWatch();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopWatch() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }

  /** Koordinat -> nama negara & kota (Bahasa Indonesia bila tersedia). */
  async function reverseGeocode(lat: number, lon: number) {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`
    );
    if (!res.ok) throw new Error("reverse geocode gagal");
    const json = (await res.json()) as {
      countryName?: string;
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };
    return {
      country: json.countryName ?? "",
      city: json.city || json.locality || json.principalSubdivision || "",
    };
  }

  /** Mulai deteksi realtime: posisi terus disegarkan sampai akurasinya stabil. */
  function detect() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error("Perangkat Anda tidak mendukung deteksi lokasi. Pilih manual.");
      return;
    }

    setDetecting(true);
    setAccuracy(null);
    setDetected(null);
    bestAccRef.current = Infinity;
    geocodedRef.current = false;

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setAccuracy(acc);

        // geocode pada fix pertama; ulangi bila fix berikutnya jauh lebih akurat
        if (!geocodedRef.current || acc < bestAccRef.current * 0.6) {
          bestAccRef.current = acc;
          geocodedRef.current = true;
          try {
            const loc = await reverseGeocode(latitude, longitude);
            if (loc.country) {
              // samakan dengan daftar negara platform (mis. "The Netherlands" -> tak ada)
              const match = COUNTRIES.find(
                (c) => c.toLowerCase() === loc.country.toLowerCase()
              );
              onCountry(match ?? loc.country);
            }
            if (loc.city) onCity(loc.city);
            setDetected({ ...loc, latitude, longitude });
            toast.success(
              `Lokasi terdeteksi: ${[loc.city, loc.country].filter(Boolean).join(", ")}.`,
              { title: "Deteksi lokasi berhasil" }
            );
          } catch {
            toast.error(
              "Gagal menerjemahkan koordinat menjadi alamat. Silakan pilih manual."
            );
          } finally {
            stopWatch();
            setDetecting(false);
            if (timerRef.current) clearTimeout(timerRef.current);
          }
        }
      },
      (err) => {
        stopWatch();
        setDetecting(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Izin lokasi ditolak. Anda tetap bisa memilih negara & kota manual di bawah."
          );
        } else {
          toast.error("Deteksi lokasi gagal (sinyal GPS lemah). Coba lagi atau isi manual.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // pengaman: jangan biarkan spinner selamanya
    timerRef.current = setTimeout(() => {
      if (watchRef.current !== null) {
        stopWatch();
        setDetecting(false);
        toast.info("Deteksi terlalu lama - silakan isi lokasi manual.");
      }
    }, 25000);
  }

  function cancel() {
    stopWatch();
    if (timerRef.current) clearTimeout(timerRef.current);
    setDetecting(false);
  }

  // negara hasil deteksi mungkin di luar daftar -> tampilkan sebagai opsi ekstra
  const countryOptions =
    country && !COUNTRIES.includes(country)
      ? [country, ...COUNTRIES]
      : COUNTRIES;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold">
          Negara / Lokasi <span className="text-brand">*</span>
        </label>
      </div>

      {/* Panel deteksi otomatis */}
      <div
        className={cn(
          "mt-2 rounded-xl border border-dashed p-4",
          detected ? "border-green-200 bg-green-50/60" : "border-line bg-surface/60"
        )}
      >
        {detecting ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-200/60" />
                <Navigation className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">Mendeteksi lokasi Anda…</p>
                <p className="mt-0.5 text-xs text-muted">
                  {accuracy !== null ? `Sinyal GPS realtime · akurasi ±${Math.round(accuracy)} m` : "Menghubungkan ke GPS perangkat…"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cancel}
              className="shrink-0 rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold text-muted transition hover:bg-surface"
            >
              Batalkan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <LocateFixed className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">
                  {detected ? "Lokasi terdeteksi" : "Males isi satu-satu?"}
                </p>
                {detected ? (
                  <p className="mt-0.5 truncate text-xs text-green-700">
                    <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {[detected.city, detected.country].filter(Boolean).join(", ")}
                    <span className="text-green-600/70">
                      {" "}({detected.latitude.toFixed(4)}, {detected.longitude.toFixed(4)})
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">
                    Tap tombol di kanan - kami mengisi negara & kota otomatis dari GPS Anda.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={detect}
              className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-navy-dark"
            >
              {detected ? "Deteksi Ulang" : "Deteksi Otomatis"}
            </button>
          </div>
        )}
      </div>

      {/* Pilihan manual (fallback / koreksi) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-muted">Pilih negara</label>
          <select
            aria-label="Negara"
            className={cn(
              "mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition",
              error ? "border-brand" : "border-line focus:border-navy"
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
          <label className="block text-xs font-semibold text-muted">Kota</label>
          <input
            aria-label="Kota"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-navy"
            placeholder="Contoh: Kuala Lumpur"
            value={city}
            onChange={(e) => onCity(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-brand">{error}</p>}
    </div>
  );
}
