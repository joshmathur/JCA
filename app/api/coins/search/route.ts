// app/api/coins/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { CoinSearchResult } from '@/types/coin';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q'); 

  // Don't bother hitting CoinGecko for empty or very short queries
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const url = new URL(`${COINGECKO_BASE}/search`);
    url.searchParams.set('query', query.trim());

    const response = await fetch(url.toString(), {
      headers: {
        'x-cg-api-key': process.env.COINGECKO_API_KEY ?? '',
        'Accept': 'application/json',
      },
      // Search results can be cached briefly — 60 seconds is fine
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko search responded with status ${response.status}`);
    }

    const data = await response.json();

    // CoinGecko returns { coins: [...], exchanges: [...], categories: [...] }
    // We only care about the coins array
    if (!data.coins || !Array.isArray(data.coins)) {
      throw new Error('Unexpected response shape from CoinGecko search');
    }

    // Whitelist fields and limit to top 8 results
    const results: CoinSearchResult[] = data.coins
      .slice(0, 8)
      .map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        thumb: coin.thumb ?? '',
        market_cap_rank: coin.market_cap_rank ?? null,
      }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('[/api/coins/search] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search coins' },
      { status: 500 }
    );
  }
}