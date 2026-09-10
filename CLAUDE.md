# AGENTS.md

## Overview

KaryaDiaspora is an MVP directory/catalog platform for Indonesian diaspora businesses, products, research, and creative works. It lets diaspora members submit products (pending review), admins curate them, and the public browse and contact owners.

- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript (strict), Tailwind CSS v4
- **Backend:** Supabase (Postgres + Google OAuth + Storage), Resend for transactional email
- **Package manager:** npm
- **Testing:** Vitest

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # production build (Next.js)
npm run start        # serve production build (default port 3000)
npm run lint         # ESLint (next lint)
npm test             # Vitest run (24 tests)
npm run test:watch   # Vitest watch mode
```

## Conventions

- **Data access goes through `src/lib/data.ts`** — never query Supabase directly from components. All product reads use `SAFE_PRODUCT_COLUMNS` (the column allow-list from migration 0005/0019) so contact columns (`owner_email`, `owner_whatsapp`) never leak into public RSC payloads.
- **Admin state is DB-only.** `profiles.role = 'admin'` is the single source of truth. There is no env/allowlist fallback (`src/lib/auth.ts`).
- **Server Components fetch data**; member/admin pages use `export const dynamic = "force-dynamic"`.
- **API errors** go through `serverError()` (`src/lib/api-error.ts`) — generic in production, detailed in dev.
- **Validation** is centralized in `validateSubmissionPayload()` (`src/lib/validation.ts`) — shared by POST (submit) and PATCH (edit).
- File/commit text, comments, docs, and code identifiers are **English only**. User-facing copy is Indonesian.

```tsx
// Example: safe product query pattern
const supabase = await createClient();
const { data, error } = await supabase
  .from("products")
  .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`, { count: "exact" })
  .eq("status", "published");
```

## Boundaries

- **NEVER** commit `.env`, `.env.local`, or any file containing `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, or `RESEND_API_KEY`. `.env*.local` is git-ignored; keys live only in `.env.local`.
- **NEVER** use `createAdminClient()` (service-role, bypasses RLS) in client components or public pages. It is server-side only. Public pages that need owner data use dedicated functions (`getPublishedProductContact`, `getOwnerPublicBio`) that expose only safe fields.
- **NEVER** expose `owner_email` / `owner_whatsapp` in public REST reads — they are revoked from `anon`/`authenticated` (migration 0005/0019) and only reachable via the rate-limited `/api/products/[id]/contact` endpoint.
- **ALWAYS** keep the curation contract: member submit/edit forces `status = 'pending'` and resets `review_note`; only admin changes status. Enforced in `data.ts` and tested in `src/lib/curation-flow.test.ts`.
- **NEVER** restore the public `record_product_view` RPC (dropped in migration 0009); view counting goes through the rate-limited `/api/products/[id]/view` route.

## Dependencies

| Package | Purpose |
|---|---|
| `next` / `react` / `react-dom` | Framework + UI runtime (App Router, RSC) |
| `@supabase/ssr` + `@supabase/supabase-js` | Auth cookie handling + DB/storage client |
| `tailwindcss` v4 + `@tailwindcss/postcss` | Styling |
| `leaflet` + `@types/leaflet` | Map tiles (location picker / mini map) |
| `lucide-react` | Icons |
| `@vercel/analytics` | Analytics beacon |
| `vitest` + `@vitest/coverage-v8` | Unit tests |
| `typescript` + `eslint` + `eslint-config-next` | Type/lint toolchain |

## Config

Environment variables (copy `.env.example` to `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g. `https://<ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key (server only, **never** client)
- `NEXT_PUBLIC_SITE_URL` — canonical site URL (used by OG image + email links)
- `SUPABASE_ACCESS_TOKEN` — Management API token (ops only, e.g. updating auth config)
- `RESEND_API_KEY` — optional; email is a graceful no-op when empty

## Error Handling

- `serverError(e, context, fallback)` returns a generic 500 in production and appends the real `e.message` in dev, while always `console.error`-ing on the server.
- Email sending is fire-and-forget; failures never fail the primary action.
- Storage uploads validate magic bytes (not just MIME) and enforce per-user file quotas.

## Troubleshooting

1. **`permission denied for table products`** — run `supabase/setup-all.sql` (grants SELECT/USAGE to `anon`/`authenticated`). This regresses whenever tables are recreated.
2. **Admin "Kelola Admin" always returns 500** — previously caused by a missing `{}` on `if (error)` in `src/app/api/admin/manage/route.ts`; fixed in Round-5. Re-check if it regresses.
3. **Google avatar broken** — CSP `img-src` must include `https://lh3.googleusercontent.com` and `https://*.googleusercontent.com` (see `next.config.ts`).
4. **OAuth callback rejected** — update `site_url` and `uri_allow_list` in Supabase Auth config (Dashboard or Management API) to include the current host, including any tunnel URL.
5. **Submit/edit fails "null value in column short_description"** — migration 0022 made it nullable; ensure DB is migrated past 0022.
