import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublishedProductContact } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { contactMessageEmail } from "@/lib/email/templates";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * GET /api/products/[id]/contact - kontak pemilik produk published.
 * Kolom kontak tidak di-grant ke anon/authenticated di database (migration
 * 0005) sehingga satu-satunya jalan mengambil kontak adalah endpoint ini -
 * yang rate-limited untuk mencegah scraping massal data PII pemilik.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: maks 30 kali per 10 menit per IP.
  const rl = rateLimit(rateLimitKey(request, null, "contact"), 30, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu sering meminta kontak. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database belum terhubung." }, { status: 500 });
  }

  const { id } = await params;
  // Validasi format UUID untuk menghindari query sampah.
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const contact = await getPublishedProductContact(id);
    if (!contact) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: "Gagal memuat kontak." }, { status: 500 });
  }
}

/**
 * POST /api/products/[id]/contact - kirim pesan ke pemilik via email relay.
 *
 * Anti-spam berlapis:
 * 1. Login-only (tamu tetap bisa memakai kontak yang tampil di pop-up).
 * 2. Rate limit 3 pesan per jam per user.
 * 3. Honeypot field "company" - bot yang mengisinya ditolak diam-diam.
 * 4. Pesan maks 2000 karakter; email pemilik TIDAK dikirim ke pengirim -
 *    balasan terjadi via Reply-To email pengirim.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Masuk untuk mengirim pesan ke pemilik." },
      { status: 401 }
    );
  }

  const rl = rateLimit(rateLimitKey(request, user.id, "contact-msg"), 3, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Batas 3 pesan per jam tercapai. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: { message?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  // Honeypot: diisi bot -> tolak diam-diam (balas sukses palsu).
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Pesan maksimal 2000 karakter." }, { status: 400 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const contact = await getPublishedProductContact(id);
    if (!contact) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    const content = contactMessageEmail({
      ownerName: contact.ownerName,
      productName: contact.productName,
      senderName: user.name,
      senderEmail: user.email,
      message,
    });
    const result = await sendEmail({
      to: contact.ownerEmail,
      subject: content.subject,
      html: content.html.replace(
        "</head>",
        `<meta name="reply-to" content="${user.email}"/></head>`
      ),
    });
    if (result.error) {
      console.error("[email] contactMessage:", result.error);
      return NextResponse.json(
        { error: "Gagal mengirim pesan. Coba lagi nanti." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." }, { status: 500 });
  }
}
