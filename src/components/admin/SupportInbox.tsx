"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCheck, MessagesSquare } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast/ToastProvider";
import { ChatPanel } from "@/components/support/ChatPanel";
import type { SupportMessage, SupportSession } from "@/lib/data";

interface Props {
  selfId: string;
}

type Tab = "active" | "history";

type View =
  | { kind: "list" }
  | { kind: "chat"; session: SupportSession; messages: SupportMessage[] };

/**
 * Inbox chat support admin: tab Aktif/Riwayat, badge unread per sesi,
 * balas langsung dari panel, tombol Selesaikan untuk menutup sesi.
 */
export function SupportInbox({ selfId }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [sessions, setSessions] = useState<SupportSession[] | null>(null);
  const [view, setView] = useState<View>({ kind: "list" });
  const [closing, setClosing] = useState(false);

  const refresh = useCallback(async (t: Tab) => {
    try {
      const res = await fetch(`/api/admin/support?tab=${t}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { sessions: SupportSession[] };
      setSessions(json.sessions);
    } catch {
      /* biarkan state lama */
    }
  }, []);

  useEffect(() => {
    void refresh(tab);
    const interval = setInterval(() => void refresh(tab), 30_000);
    return () => clearInterval(interval);
  }, [tab, refresh]);

  async function openSession(s: SupportSession) {
    try {
      const res = await fetch(`/api/admin/support/${s.id}`, { cache: "no-store" });
      const json = (await res.json()) as { session?: SupportSession; messages?: SupportMessage[]; error?: string };
      if (!res.ok || !json.session) {
        toast.error(json.error ?? "Gagal membuka percakapan.");
        return;
      }
      setView({ kind: "chat", session: json.session, messages: json.messages ?? [] });
      // Tandai dibaca -> badge unread di daftar ikut bersih.
      setSessions((prev) => prev?.map((x) => (x.id === s.id ? { ...x, unread: false } : x)) ?? prev);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    }
  }

  async function closeSession() {
    if (view.kind !== "chat" || closing) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/support/${view.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menutup sesi.");
        return;
      }
      toast.success("Sesi diselesaikan.");
      setView({
        kind: "chat",
        session: { ...view.session, status: "closed", closedBy: "admin" },
        messages: view.messages,
      });
      void refresh(tab);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setClosing(false);
    }
  }

  /* --------------------------- tampilan chat --------------------------- */
  if (view.kind === "chat") {
    const s = view.session;
    return (
      <div className="flex h-[calc(100vh-10rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button
            onClick={() => {
              setView({ kind: "list" });
              void refresh(tab);
            }}
            aria-label="Kembali ke inbox"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-surface hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy">{s.subject || "Percakapan"}</p>
            <p className="text-[11px] text-muted">
              {s.status === "open" ? "Sesi aktif" : "Sesi ditutup"} · {timeAgo(s.lastMessageAt)}
            </p>
          </div>
          {s.status === "open" && (
            <button
              onClick={() => void closeSession()}
              disabled={closing}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {closing ? "Menutup…" : "Selesaikan"}
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <ChatPanel
            session={s}
            initialMessages={view.messages}
            selfId={selfId}
            apiBase={`/api/admin/support/${s.id}`}
            peerLabel="Member"
          />
        </div>
      </div>
    );
  }

  /* --------------------------- tampilan inbox -------------------------- */
  return (
    <div className="space-y-4">
      {/* Tab Aktif / Riwayat */}
      <div className="flex gap-2">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-bold transition",
              tab === t
                ? "bg-navy text-white"
                : "border border-line bg-white text-muted hover:text-navy"
            )}
          >
            {t === "active" ? "Aktif" : "Riwayat"}
            {t === "active" && sessions !== null && tab === "active" && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5">{sessions.length}</span>
            )}
          </button>
        ))}
      </div>

      {sessions === null ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center text-sm text-muted">
          Memuat inbox…
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <MessagesSquare className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">
            {tab === "active" ? "Tidak ada sesi aktif" : "Belum ada riwayat"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {tab === "active"
              ? "Pesan baru dari member akan muncul di sini."
              : "Sesi yang sudah diselesaikan akan tersimpan di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => void openSession(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition hover:shadow-sm",
                s.unread ? "border-brand/40 ring-1 ring-brand/20" : "border-line"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  s.unread ? "bg-brand-soft text-brand" : "bg-surface text-muted"
                )}
              >
                <MessagesSquare className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-navy">{s.userName}</span>
                  {s.unread && (
                    <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                      Baru
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">{s.subject || "-"}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted/70">{timeAgo(s.lastMessageAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
