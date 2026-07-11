# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build (Turbopack) + full TypeScript check
npm start        # serve the production build
npm run lint     # eslint (eslint.config.mjs, next core-web-vitals + TS)
```

There is no test framework configured in this repo. `npm run build` is the authoritative check — it runs `tsc` in strict mode across the whole project. App pages sit behind an auth guard, so an unauthenticated request to `/dashboard` etc. redirects to `/login`; a `200` from those routes still confirms they compile.

## Stack & conventions

- **Next.js 16 (App Router) + React 19.2 + TypeScript (strict) + Tailwind CSS v4.** See `@AGENTS.md` — this Next.js version has breaking changes from training data; consult `node_modules/next/dist/docs/` before writing framework code.
- **Next 16 renamed `middleware.ts` → `proxy.ts`.** The root `proxy.ts` (exporting `proxy` + `config`) is this project's middleware.
- **UI libs:** `motion` (the post-rebrand Framer Motion — import from `motion/react`, **not** `framer-motion`), `shadcn/ui` (components copied into `components/ui/`, config in `components.json`), `lucide-react` icons, `recharts`.
- Import alias: `@/*` maps to the repo root (e.g. `@/lib/supabase/client`, `@/types/coin`).
- Required env vars (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (admin client / cron), `COINGECKO_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET` (protects the cron route), and `VERCEL_URL` (set automatically on Vercel).

## Architecture

JCA is a crypto research assistant (watchlist, news, per-coin AI analysis, daily AI picks). It executes no trades. Backend logic lives almost entirely in App Router **route handlers** under `app/api/`; pages under `app/*/page.tsx` are thin **client** components (`'use client'`) that fetch those routes.

### Auth & Supabase clients (`lib/supabase/`)
Supabase SSR auth. There are **four** clients — pick by execution context:
- `client.ts` — browser (anon key). Used in `'use client'` pages/components via `createClient().auth.getUser()` / `onAuthStateChange`.
- `server.ts` — server components & route handlers (anon key, reads request cookies).
- `middleware.ts` — `updateSession()` refreshes the session cookie and enforces the route guard.
- `admin.ts` — service-role key, **bypasses Row Level Security**. Server-only, for trusted jobs with no logged-in user (the picks cron). Never import into browser code.

`proxy.ts` runs `updateSession` on every non-asset request. It refreshes the session and **guards the protected paths `/dashboard`, `/watchlist`, `/news`, `/picks`** — unauthenticated requests redirect to `/login`. Tables: `watchlist` and `picks`.

### Internal server-to-server fetches
Higher-level routes compose lower-level ones by fetching them over HTTP rather than importing shared functions. Both `app/api/ai/analyze/route.ts` and `lib/generatePicks.ts` call `/api/coins` and `/api/news` through a `getBaseUrl()` helper (returns `https://$VERCEL_URL` in prod, `http://localhost:3000` in dev). When changing the shape of `/api/coins` or `/api/news`, remember these internal callers depend on it, not just the frontend.

### External data sources
- **Prices — CoinGecko** (`app/api/coins/`). `fetchCoinsByIds` is the single validating transform, shared by the `?ids=` path and the `?trending=true` path (which resolves trending IDs via `/search/trending` first). `/api/coins/search` powers watchlist search. All CoinGecko calls send the key via the `x-cg-api-key` header and use Next `fetch` `revalidate` caching (prices 30s, trending 300s, search 60s).
- **News — RSS** (`app/api/news/`). `/api/news/coindesk` and `/api/news/cointelegraph` each parse a feed with `rss-parser` and strip HTML. `/api/news/route.ts` fans out to both in parallel, merges, dedupes by URL, sorts newest-first, and optionally filters by a `?coins=bitcoin,ethereum` substring match. Cached 300s.

### AI integration pattern (important — repeated in two places)
Both `app/api/ai/analyze/route.ts` (per-coin analysis) and `lib/generatePicks.ts` (daily picks) follow the same contract with the Anthropic SDK, and changes to one usually apply to the other:

- Model `claude-haiku-4-5-20251001`. The system prompt contains the full JSON schema plus explicit rules.
- **Prefill trick:** the final message is `{ role: 'assistant', content: '{' }` so the model emits raw JSON with no preamble/scratchpad. The response is reassembled as `'{' + textBlock.text` then `JSON.parse`d defensively (a parse failure returns HTTP 502 / throws, never a partial object).
- Every parsed response is checked with a hand-written type guard (`isValidAnalysis` / `isValidPicksResponse`) before use.
- Because there is no scratchpad, **field order in the schema is the model's reasoning order** — reasoning/outlook fields come before `confidence`, and confidence uses explicit mutually-exclusive calibration criteria to avoid defaulting to `"medium"`.
- Prompt-stated invariants are **also enforced in code** — e.g. when `outlook === 'unfavorable'`, the analyze route overwrites `entryZone`/`exitZone`/`stopLoss` to "N/A" rather than trusting the model.

### Daily picks flow
`generateAndSavePicks()` in `lib/generatePicks.ts` is the shared implementation with two callers: `POST /api/ai/picks` (manual/dev trigger) and `GET /api/cron/picks` (Vercel Cron, gated by a `Bearer $CRON_SECRET` header). It fetches trending coins, filters by a `MIN_MARKET_CAP` floor, asks Claude to select standout picks, and — only if the new batch is non-empty — replaces all rows in the `picks` table. `GET /api/ai/picks` is the cheap read used on page load.

### Frontend / UI system
Dark-forest visual theme. Key structural facts:

- **Theme tokens live on `:root` in `app/globals.css`.** The app is always-dark — the forest palette (hex) is mapped directly onto shadcn's token names (`--background`, `--card`, `--primary`, `--border`, …) plus custom `--positive`/`--negative`; there is **no dark-class toggle**. Tailwind v4 is CSS-first (no `tailwind.config.js`; theme via `@theme inline`). Nature-motif utilities are defined here: `.surface-grain`, `.divider-organic`, `.shadow-forest`, `.text-forest-gradient`. Fonts (`next/font`): DM Sans → `--font-sans`, Fraunces → `--font-heading` (headings).
- **`components/AppShell.tsx`** is route-aware chrome, rendered by `layout.tsx`: **bare** full-bleed on `/login` `/signup`, **header-only** on `/` (landing), **header + sidebar** on app pages. It hosts `<MotionConfig reducedMotion="user">` and the ambient background layers.
- **Route transitions use Motion, not the native View Transitions API.** `components/PageTransition.tsx` does an enter-only (keyed on `pathname`) fade/blur. **Do not** enable `experimental.viewTransition` and reach for React's `<ViewTransition>` — stable `react`/`react-dom` 19.2.4 ship no `ViewTransition` export or `startViewTransition`; it only works on experimental React builds (verified — don't waste time rediscovering this).
- **Ambient/decorative components** are pure SVG + `requestAnimationFrame`/Motion with **deterministic (index-hashed, no `Math.random`) geometry** so SSR and client markup match: `Treeline`, `GrassField` (footer, cursor-parting grass), and `components/ambient/*` (`MouseGlow` cursor "flashlight" that masks a hidden `ForestBackdrop`, `Fireflies`). These are `pointer-events-none` except `GrassField`, which handles its own pointer interaction.
- **Shared UI pieces:** `components/Badges.tsx` (`ConfidenceBadge`/`OutlookBadge`, reused by analysis + picks), `components/analysis/AnalysisCard.tsx` (the AI analysis thinking/error/result states), `components/auth/AuthUI.tsx` (login+signup share this kit so switching routes reads as a morph).

### Conventions to match
- External data (CoinGecko, RSS, Claude) is always validated and field-whitelisted before use; never trust raw shapes.
- Route errors are logged as `console.error('[METHOD /path]', ...)` and returned as `NextResponse.json({ error }, { status })`.
- New animated UI uses `motion/react`; keep decorative SVG geometry deterministic to avoid hydration mismatches, and route transitions enter-only to avoid App Router exit-jank.
