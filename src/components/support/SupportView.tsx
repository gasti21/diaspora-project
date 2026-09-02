"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MessageSquarePlus, MessagesSquare, TriangleAlert } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast/ToastProvider";
import { ChatPanel } from "./ChatPanel";
import type { SupportMessage, SupportSession } from "@/lib/data";

interface Props {
  selfId: string;
}

type View =
  | { kind: "list" }
  | { kind: "chat"; session: SupportSession; messages: SupportMessage[] };

/**
 * Halaman Chat Support member: daftar sesi (aktif di atas, riwayat di
 * bawah), buka sesi -> panel chat, atau mulai sesi baru (jika tidak ada
 * yang aktif). Sesi closed bersifat read-only permanen.
 */
export function SupportView({ selfId }: Props) {
  const toast = useToast();
  const [sessions, setSessions] = useState<SupportSession[] | null>(null);
  const [view, setView] = useState<View>({ kind: "list" });
  const [draftFirst, setDraftFirst] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/support/sessions", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { sessions: SupportSession[] };
      setSessions(json.sessions);
    } catch {
      /* biarkan state lama */
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  async function openSession(s: SupportSession) {
    try {
      const res = await fetch(`/api/support/sessions/${s.id}/messages`, { cache: "no-store" });
      const json = (await res.json()) as { session?: SupportSession; messages?: SupportMessage[]; error?: string };
      if (!res.ok || !json.session) {
        toast.error(json.error ?? "Gagal membuka percakapan.");
        return;
      }
      setConfirmClose(false);
      setView({ kind: "chat", session: json.session, messages: json.messages ?? [] });
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    }
  }

  async function createSession() {
    const text = draftFirst.trim();
    if (!text || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/support/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = (await res.json()) as { session?: SupportSession; error?: string };
      if (!res.ok || !json.session) {
        toast.error(json.error ?? "Gagal memulai sesi.");
        return;
      }
      setDraftFirst("");
      toast.success("Sesi dimulai! Tim kami akan segera membalas.");
      await refreshSessions();
      await openSession(json.session);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  async function closeSession() {
    if (view.kind !== "chat" || closing) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/support/sessions/${view.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menutup sesi.");
        return;
      }
      toast.success("Sesi ditutup. Riwayat tetap tersimpan.");
      setConfirmClose(false);
      await refreshSessions();
      setView({ kind: "chat", session: { ...view.session, status: "closed", closedBy: "user" }, messages: view.messages });
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setClosing(false);
    }
  }

  /* ------------------------- tampilan chat ------------------------- */
  if (view.kind === "chat") {
    const s = view.session;
    return (
      <div className="flex h-[calc(100vh-10rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button
            onClick={() => {
              setView({ kind: "list" });
              void refreshSessions();
            }}
            aria-label="Kembali ke daftar sesi"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-surface hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy">{s.subject || "Percakapan"}</p>
            <p className="text-[11px] text-muted">
              {s.status === "open" ? "Sesi aktif" : "Sesi ditutup"} · dimulai {timeAgo(s.createdAt)}
            </p>
          </div>
          {s.status === "open" && !confirmClose && (
            <button
              onClick={() => setConfirmClose(true)}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-200 hover:text-red-600"
            >
              Tutup Sesi
            </button>
          )}
        </div>

        {confirmClose && s.status === "open" && (
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <div className="flex-1 text-xs leading-relaxed text-amber-800">
              <p className="font-bold">Tutup sesi ini?</p>
              <p>Sesi yang ditutup tidak bisa dibuka lagi - mulai sesi baru untuk topik berikutnya.</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => void closeSession()}
                  disabled={closing}
                  className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {closing ? "Menutup…" : "Ya, tutup"}
                </button>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1">
          <ChatPanel
            session={s}
            initialMessages={view.messages}
            selfId={selfId}
            apiBase={`/api/support/sessions/${s.id}`}
            peerLabel="Tim Support"
          />
        </div>
      </div>
    );
  }

  /* ------------------------- tampilan daftar ------------------------ */
  const active = sessions?.find((s) => s.status === "open") ?? null;
  const history = sessions?.filter((s) => s.status === "closed") ?? [];

  return (
    <div className="space-y-6">
      {/* Mulai sesi baru (hanya bila tidak ada sesi aktif) */}
      {!active && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <MessageSquarePlus className="h-4 w-4 text-brand" aria-hidden="true" />
            Mulai Sesi Baru
          </h2>
          <p className="mt-1 text-xs text-muted">
            Ceritakan pertanyaan atau kendala Anda - tim kami biasanya membalas dalam 1x24 jam.
          </p>
          <textarea
            value={draftFirst}
            onChange={(e) => setDraftFirst(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Contoh: Halo, saya ingin bertanya tentang cara memperbarui foto produk saya…"
            className="mt-3 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-brand/50 focus:bg-white"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted/70">{draftFirst.length}/2000</span>
            <button
              onClick={() => void createSession()}
              disabled={creating || !draftFirst.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? "Mengirim…" : "Kirim & Mulai Sesi"}
            </button>
          </div>
        </div>
      )}

      {/* Sesi aktif */}
      {active && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Sesi Aktif</h2>
          <SessionCard session={active} onOpen={() => void openSession(active)} active />
        </section>
      )}

      {/* Riwayat */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Riwayat</h2>
          <div className="space-y-2">
            {history.map((s) => (
              <SessionCard key={s.id} session={s} onOpen={() => void openSession(s)} />
            ))}
          </div>
        </section>
      )}

      {sessions !== null && sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <MessagesSquare className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">Belum ada percakapan</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Tulis pesan pertama Anda di atas - tim support kami siap membantu.
          </p>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onOpen,
  active = false,
}: {
  session: SupportSession;
  onOpen: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition hover:shadow-sm",
        active ? "border-brand/40 ring-1 ring-brand/20" : "border-line"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-brand-soft text-brand" : "bg-surface text-muted"
        )}
      >
        <MessagesSquare className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-navy">
          {session.subject || "Percakapan"}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {active ? "Aktif" : session.closedBy === "auto" ? "Ditutup otomatis" : "Ditutup"} ·{" "}
          {timeAgo(session.lastMessageAt)}
        </span>
      </span>
    </button>
  );
}
