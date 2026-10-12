# Tinerary

Collaborative travel planning. Build an itinerary, share it, and let people
copy the ones worth copying.

Next.js 16 (App Router) · React 19 · Supabase (Postgres, Auth, Storage,
Realtime) · Tailwind + shadcn/ui · Resend · deployed on Vercel.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in at least the "Required" block
npm run dev
```

`.env.example` documents every variable the code reads, split into required,
required-in-production, and optional. The app refuses to boot without the
Supabase values.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve a production build |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier, write |

## Layout

```
app/              Routes, API handlers, server actions (app/actions/)
components/       UI; components/ui is shadcn
lib/              Domain services, Supabase clients, helpers
  auth/           requireAdmin / requireCron route guards
backend/services/ SMS, Twilio, notifications
supabase/
  migrations/     Schema history — read its README before adding one
  diagnostics/    Ad-hoc inspection SQL. NOT migrations, never auto-applied
docs/             Feature and operations notes
__tests__/        Vitest suites
proxy.ts          Edge auth + Phase 2 route gating (Next 16's `middleware`)
```

## Database

Schema lives in `supabase/migrations/`. **Read
[`supabase/migrations/README.md`](supabase/migrations/README.md) before adding
one** — it covers the duplicate-number history and the twelve tables adopted
in migration 076 that had previously only ever existed in the live database.

Migrations 076 and 077 are idempotent and safe to re-run.

After any schema change, regenerate types:

```bash
supabase gen types typescript --project-id <id> > lib/database.types.ts
```

## Known state

- **38 TypeScript errors**, down from 268. `next.config.mjs` still sets
  `typescript.ignoreBuildErrors: true`; do not remove it until the count is
  zero. Inventory and suggested order in [`docs/TYPE_ERRORS.md`](docs/TYPE_ERRORS.md).
- **Phase 2 is gated off.** `lib/phase2.ts` sets `PHASE_2_ENABLED = false`;
  business, creator, deals, explore, pricing, transactions, affiliate and
  mentions routes are admin-only until it flips.
- **Payments are not implemented.** `components/payment-settings.tsx` returns
  "coming soon" and there is no payment provider dependency, despite what
  `docs/PAYMENT_IMPLEMENTATION.md` describes.
- **Rate limiting needs Upstash.** Without `UPSTASH_REDIS_REST_URL` /
  `_TOKEN`, `lib/rate-limit.ts` falls back to a per-instance in-memory Map,
  which on serverless is effectively no limit.
- **Web push needs VAPID keys.** Silently inert without them.
- **i18n is scaffolded, not translated.** Six locales exist under
  `public/locales/`; only `en` has real strings.

## CI

`.github/workflows/ci.yml` runs lint, tests and a build on every PR.
Typecheck runs too, but non-required against the documented backlog — flip
`continue-on-error: false` once it reaches zero.
