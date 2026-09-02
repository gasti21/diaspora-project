import { NextResponse } from "next/server";

/**
 * Respons 500 seragam untuk semua API route.
 * - Production: pesan generik ramah (detail DB/stack tidak bocor ke publik).
 * - Development: pesan error asli disertakan agar debugging cepat.
 * - Error asli selalu dicatat di log server.
 */
export function serverError(e: unknown, logContext: string, fallback = "Terjadi kesalahan pada server. Silakan coba lagi.") {
  console.error(`[api] ${logContext}:`, e);
  const detail =
    process.env.NODE_ENV === "development" && e instanceof Error
      ? ` (${e.message})`
      : "";
  return NextResponse.json({ error: fallback + detail }, { status: 500 });
}
