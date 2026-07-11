# JCA — Josh's Crypto Aid

An AI-powered crypto **research assistant**. JCA tracks live market data and crypto news, and uses Claude to generate per-coin entry/exit analysis and a daily shortlist of picks — no trade execution, just research and decision support.

## Features

- **Accounts** — Email/password and Google sign-in (Supabase Auth); app pages are behind an auth guard
- **Live Watchlist** — Search and track coins with real-time prices and 24h change, auto-refreshing every 30 seconds
- **AI Analysis** — Claude-generated entry/exit zones and stop-loss suggestions per coin, grounded in live price data and recent news, with confidence and outlook badges
- **News Feed** — Aggregated crypto news from CoinDesk and CoinTelegraph, filterable to your watchlist coins
- **Daily Picks** — An AI-selected shortlist of standout coins with brief reasoning, generated automatically once a day (Vercel Cron)
- **Dark-forest UI** — A calm, atmospheric interface with smooth motion, a treeline hero, and interactive ambient touches (cursor glow, fireflies, wavy grass)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Animation:** Motion (`motion/react`)
- **Auth & Database:** Supabase (SSR auth + Google OAuth, Postgres)
- **Price Data:** CoinGecko API
- **News:** CoinDesk + CoinTelegraph RSS
- **AI:** Claude API (Anthropic)
- **Hosting:** Vercel

## Getting Started

```bash
git clone https://github.com/your-username/jca.git
cd jca
npm install
```

Create a `.env.local` file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only; used by the daily-picks job

# Data & AI
COINGECKO_API_KEY=
ANTHROPIC_API_KEY=

# Daily picks cron
CRON_SECRET=                 # required as a Bearer token to trigger /api/cron/picks
```

> `VERCEL_URL` is set automatically on Vercel and is used to compose internal API calls in production.

Run the dev server:

```bash
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build + full TypeScript check
npm start          # serve the production build
npm run lint       # ESLint
```

## Disclaimer

JCA is a research tool, not financial advice. It does not execute trades and is not a substitute for your own due diligence.
