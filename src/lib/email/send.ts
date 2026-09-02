import { createAdminClient } from "@/lib/supabase/admin";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "KaryaDiaspora <onboarding@resend.dev>";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Kirim satu email via Resend HTTP API (tanpa SDK).
 * - No-op aman bila RESEND_API_KEY belum diset (fitur belum diaktifkan).
 * - Return error string (bukan throw) - pemanggil fire-and-forget.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY belum diset - email dilewati." };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM ?? DEFAULT_FROM,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengirim email." };
  }
}

/**
 * Kirim email ke semua user ber-role admin (keputusan saat ini: semua admin).
 * Fire-and-forget - kegagalan email tidak pernah menggagalkan aksi utama.
 */
export async function notifyAllAdmins(subject: string, html: string): Promise<void> {
  try {
    const client = createAdminClient();
    const { data } = await client
      .from("profiles")
      .select("email, notify_email")
      .eq("role", "admin");
    const admins = (data ?? []).filter((a) => a.notify_email !== false);
    await Promise.all(admins.map((a) => sendEmail({ to: a.email, subject, html })));
  } catch (e) {
    console.error("[email] notifyAllAdmins gagal:", e);
  }
}
