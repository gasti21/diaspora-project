# DESIGN.md — KaryaDiaspora Design Tokens & Rules (Superdesign Anti-Slop)

Systemic rules and design tokens for KaryaDiaspora UI based on Superdesign.dev engineering principles.

## 1. Core Principles (Anti-Slop Rules)

1. **Space everything on 8px scale:** Spacing MUST use `8, 16, 24, 32, 48, 64px` (Tailwind `p-2, p-4, p-6, p-8, p-12`). No arbitrary `11px`, `13px`.
2. **One single accent color:** Base UI is crisp neutrals (`#FAFAFA` canvas, `#0F172A` ink, `#F1F5F9` surfaces). Brand Red (`#D32F2F`) is used EXCLUSIVELY for primary CTAs, active indicators, and critical badges.
3. **Fixed type scale & line-height:**
   - Headings: `32px` (2xl), `24px` (xl), `20px` (lg) — line-height `1.15` to `1.2`, tracking-tight, font-extrabold
   - Body: `16px` (base), `14px` (sm) — line-height `1.5`, font-normal/medium
   - Micro/labels: `12px` (xs) — line-height `1.4`, font-semibold, uppercase tracking-wide
4. **Unified Corner Radius:** Strict `6px` (`rounded-md`) across all components (buttons, inputs, cards, modals). No mixing pill buttons + 24px cards.
5. **Border Noise Reduction:** Avoid wrapping every element in 1px borders. Use subtle surface fills (`bg-slate-50`) and whitespace for division. Reserve borders (`border-slate-200/80`) for tables and explicit structural dividers.
6. **First-Class Empty & Loading States:** Every dynamic section must define clean empty, loading (skeleton pulse), and error UI states.
7. **No AI Slop Defaults:** Forbidden: purple/blue gradients, fuzzy blur halos, generic centered heroes with 3 rounded cards, lorem-ipsum placeholders.

## 2. Token Specifications

| Token | Value / Tailwind Class | Application |
|---|---|---|
| Canvas BG | `bg-[#FAFAFA]` / `bg-slate-50/50` | Page background |
| Surface BG | `bg-white` | Cards, panels, modals |
| Surface Subtle | `bg-[#F1F5F9]` / `bg-slate-100/70` | Secondary backgrounds, table headers |
| Ink Primary | `text-[#0F172A]` / `text-slate-900` | Headings, primary text |
| Ink Muted | `text-[#64748B]` / `text-slate-500` | Descriptions, labels, metadata |
| Line / Border | `border-[#E2E8F0]` / `border-slate-200` | Table hairlines, input borders |
| Accent Brand | `bg-[#D32F2F]` / `text-[#D32F2F]` | Primary buttons, active tabs, brand mark |
| Accent Hover | `bg-[#B71C1C]` | Primary button hover |
| Radius | `rounded-md` (6px) / `rounded-lg` (8px) | All interactive elements |

## 3. Component Architecture Guidelines

### Buttons
- **Primary:** `bg-[#D32F2F] text-white font-semibold px-4 py-2.5 rounded-md hover:bg-[#B71C1C] transition-colors`
- **Secondary / Neutral:** `bg-slate-100 text-slate-900 font-semibold px-4 py-2.5 rounded-md hover:bg-slate-200 transition-colors`
- **Ghost / Outline:** `border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-md hover:bg-slate-50 transition-colors`

### Cards
- Surface white with `border border-slate-200/80 rounded-md p-5`
- Hover state: subtle border color transition `hover:border-slate-300`, no floating box-shadows

### Form Controls
- Inputs & Selects: `h-10 px-3.5 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]`

### Data Tables (Admin & Member)
- Compact, border-collapsed, header `bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider py-3 px-4`, rows `border-b border-slate-100 hover:bg-slate-50/50`.
