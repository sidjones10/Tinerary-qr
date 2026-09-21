# Remaining TypeScript errors

**Current count: 38** (was 268)

`next.config.mjs` still sets `typescript.ignoreBuildErrors: true`, so these do
not block a build. **Do not remove that flag until this reaches 0** — the
build will start failing.

`npm run typecheck` runs them. CI runs it on every PR as a non-required check
(`.github/workflows/ci.yml`), so the number is visible and cannot quietly
grow. Flip `continue-on-error: false` on the `typecheck` job once this hits 0,
then delete `ignoreBuildErrors` from `next.config.mjs`.

## What is *not* in here

Every error found that could crash at runtime has been fixed:

- missing `await` on `createClient()` / `cookies()`
- a stray brace that made `lib/database.types.ts` a parse error
- destructuring inside `try` so the `catch` threw `ReferenceError`
- the lucide `Infinity` icon shadowing the global number
- `.catch()` on a `PostgrestBuilder` (PromiseLike, no `.catch`)
- `ApiClient.getAuthHeaders` / `.handleResponse`, which never existed
- `Fuse.IFuseOptions` (fuse.js v6 namespace, removed in v7)
- `parseLocalDate(null)` throwing on `null.split`
- `params.id` read without `await` on two redirect routes

What remains is type-level only: nullability the UI already handles, and
Supabase join shapes the generated types describe as arrays.

## Remaining, by cause

### Wizard step prop contracts — 7, `app/create-wizard/page.tsx`

Each step component declares its own props (`(field: string, value: any)`,
a narrow slice of the form object), and `CreateFormData` doesn't structurally
satisfy them. Fix by giving every step one shared
`WizardStepProps<CreateFormData>` instead of a bespoke signature.

### Supabase to-one joins typed as arrays — 8

`app/trip/[id]/packing/page.tsx` (3), `components/saved-items-list.tsx`,
`components/personal-feed.tsx` (2), `lib/discovery-algorithm.ts` (2).

PostgREST returns an object for a to-one embed; the generated types widen it
to an array. `lib/supabase-relations.ts` already has `one()` / `many()` for
exactly this — apply them at these call sites, as was done in
`lib/mutuals-service.ts`.

### `useState` inferred too narrowly — 6

`components/comments-section.tsx` (2), `components/feed-page.tsx` (2),
`components/affiliate-link-generator.tsx`, `app/explore/page.tsx`.

`useState([])` infers `never[]`, `useState(null)` infers `null`. Annotate the
state with the shape it actually holds.

### Third-party generic mismatches — 5

`components/mfa-settings.tsx` (2) — the local `MfaFactor` has drifted from
`@supabase/supabase-js`'s `Factor`; import theirs.
`components/enterprise-analytics-dashboard.tsx`, `lib/webhook-service.ts` (2)
— Recharts `Formatter` and a Supabase overload.

### Nullability at a prop boundary — 5

`app/followers/[userId]/page.tsx`, `app/following/[userId]/page.tsx`,
`app/promotion/[id]/page.tsx`, `app/create/page.tsx` (partly),
`components/promotion-booking-panel.tsx`.

A `string | null` or `boolean | null` from the database meeting a prop that
declares `string` / `boolean`. Either widen the prop or default at the call
site — widening is usually the honest one, since the column really is
nullable.

### One-offs — 7

- `app/api/admin/send-email/route.ts:80` — a number passed where a string is
  expected.
- `app/api/discovery/similar/route.ts:75` — overload mismatch.
- `app/create/page.tsx:1534` — an `async (showToast?: boolean)` handler used
  directly as `onClick`, which passes a `MouseEvent` into `showToast`. Worth
  looking at: it is a latent behavior bug, not just a type complaint.
- `app/create/page.tsx:569,573` — form payload shape.
- `components/discovery-feed.tsx:185`, `hooks/use-itinerary.tsx:175` — feed
  item shapes.
- `scripts/test-expense-creation.ts:146` — a dev script, lowest priority.

## Suggested order

1. The `one()` / `many()` pass — mechanical, 8 errors, pattern already exists.
2. `useState` annotations — mechanical, 6 errors.
3. `app/create/page.tsx:1534` — the only remaining one with real behavior
   behind it.
4. Wizard step props — 7 errors, one focused refactor.
5. The rest.
