import { SITE_URL } from "@/lib/supabase/config";

export const BRAND = { navy: "#16274e", red: "#d32f2f", muted: "#64748b", line: "#e2e8f0" };

export interface EmailContent {
  subject: string;
  html: string;
}

/** Layout email dasar brand KaryaDiaspora (table-based agar aman di klien email). */
function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding-bottom:24px;">
      <span style="display:inline-block;width:14px;height:34px;background:${BRAND.red};border-radius:3px;transform:rotate(45deg);"></span>
      <span style="font-size:22px;font-weight:800;color:${BRAND.navy};vertical-align:middle;margin-left:10px;">Karya<span style="color:${BRAND.red};">Diaspora</span></span>
    </div>
    <div style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.navy};">${title}</h1>
      <div style="font-size:14px;line-height:1.7;color:#334155;">${bodyHtml}</div>
      ${
        cta
          ? `<div style="text-align:center;margin-top:28px;">
        <a href="${cta.href}" style="display:inline-block;background:${BRAND.red};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;">${cta.label}</a>
      </div>`
          : ""
      }
    </div>
    <p style="text-align:center;font-size:11px;color:${BRAND.muted};margin-top:20px;">
      Email otomatis dari KaryaDiaspora - Platform Konektivitas Bisnis Diaspora Indonesia.<br/>
      Atur preferensi di <a href="${SITE_URL}/profil" style="color:${BRAND.red};">halaman profil</a> Anda.
    </p>
  </div>
</body></html>`;
}

/** 1) Pengajuan produk member disetujui & tayang. */
export function productApprovedEmail(opts: { memberName: string; productName: string; slug: string }): EmailContent {
  return {
    subject: `🎉 Produk Anda sudah tayang: ${opts.productName}`,
    html: layout(
      "Selamat, produk Anda sudah tayang! 🎉",
      `<p>Halo ${opts.memberName},</p>
       <p>Pengajuan <strong>"${opts.productName}"</strong> telah disetujui kurator dan
       <strong style="color:${BRAND.red};">kini tayang di katalog KaryaDiaspora</strong>.</p>
       <p>Bagikan link produk Anda agar lebih banyak orang melihat karya Anda:</p>` ,
      { label: "Lihat Produk Saya", href: `${SITE_URL}/produk/${opts.slug}` }
    ),
  };
}

/** 2) Admin membalas chat support member. */
export function supportReplyEmail(opts: { memberName: string; sessionSubject: string; sessionId: string; preview: string }): EmailContent {
  return {
    subject: `💬 Tim Support membalas: ${opts.sessionSubject}`,
    html: layout(
      "Anda mendapat balasan dari Tim Support",
      `<p>Halo ${opts.memberName},</p>
       <p>Tim kami telah membalas percakapan <strong>"${opts.sessionSubject}"</strong>:</p>
       <div style="background:#f8fafc;border:1px solid ${BRAND.line};border-radius:10px;padding:14px 16px;margin:12px 0;font-style:italic;color:#475569;">\u201c${opts.preview}\u201d</div>
       <p>Buka platform untuk melanjutkan percakapan.</p>`,
      { label: "Buka Chat", href: `${SITE_URL}/support` }
    ),
  };
}

/** Pesan dari user login ke pemilik produk (email relay - email pemilik tak terbuka). */
export function contactMessageEmail(opts: {
  ownerName: string;
  productName: string;
  senderName: string;
  senderEmail: string;
  message: string;
}): EmailContent {
  const safeMessage = opts.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return {
    subject: `Pesan tentang produk Anda: ${opts.productName}`,
    html: layout(
      "Ada yang tertarik dengan produk Anda!",
      `<p>Halo ${opts.ownerName},</p>
       <p><strong>${opts.senderName}</strong> (${opts.senderEmail}) mengirim pesan
       melalui katalog KaryaDiaspora untuk produk <strong>"${opts.productName}"</strong>:</p>
       <div style="background:#f8fafc;border:1px solid ${BRAND.line};border-radius:10px;padding:14px 16px;margin:12px 0;line-height:1.7;color:#334155;">${safeMessage}</div>
       <p>Balas langsung ke email pengirim: <strong>${opts.senderEmail}</strong>.</p>`
    ),
  };
}

/** 3) Pengajuan baru masuk - notifikasi ke semua admin. */
export function newSubmissionEmail(opts: { ownerName: string; productName: string; productId: string }): EmailContent {
  return {
    subject: `📥 Pengajuan baru: ${opts.productName}`,
    html: layout(
      "Pengajuan produk baru menunggu review",
      `<p><strong>${opts.ownerName}</strong> mengajukan produk
       <strong>"${opts.productName}"</strong>.</p>
       <p>Produk menunggu review Anda di panel admin.</p>`,
      { label: "Review Sekarang", href: `${SITE_URL}/admin/produk?status=pending` }
    ),
  };
}
