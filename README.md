# JCA — Josh's Crypto Aid

An AI-powered crypto trading assistant. JCA analyzes live market data and crypto news to generate entry/exit signals and daily coin picks — no trade execution, just research and decision support.

## Features

- **Live Watchlist** — Search and track coins with real-time prices and 24h change, auto-refreshing every 30 seconds
- **News Feed** — Aggregated crypto news from CoinDesk and CoinTelegraph, filterable by your watchlist coins
- **AI Analysis** — Claude-generated entry/exit zones and stop-loss suggestions per coin, grounded in live price data and recent news
- **Daily Picks** — On-demand AI-generated coin picks with brief reasoning, pulled from market trends and news

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase
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

Create a `.env.local` file with the following:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
COINGECKO_API_KEY=
ANTHROPIC_API_KEY=
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Status

🚧 In active development. Core features (watchlist, news, AI analysis, daily picks) are built; authentication and deployment are in progress.

## Disclaimer

JCA is a research tool, not financial advice. It does not execute trades and is not a substitute for your own due diligence.