// app/api/coins/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { CoinPrice } from '@/types/coin';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Shared transform: given a comma-separated ids string, fetches full
// market data from CoinGecko and whitelists/validates it into CoinPrice[].
// Used by both the ?ids= path and the ?trending=true path so validation
// logic only lives in one place.
async function fetchCoinsByIds(ids: string): Promise<CoinPrice[]> {
  const url = new URL(`${COINGECKO_BASE}/coins/markets`);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('ids', ids);
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('sparkline', 'true');
  url.searchParams.set('price_change_percentage', '24h');

  const response = await fetch(url.toString(), {
    headers: {
      'x-cg-api-key': process.env.COINGECKO_API_KEY ?? '',
      'Accept': 'application/json',
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko responded with status ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response shape from CoinGecko');
  }

  return data.map((coin: any) => {
    if (typeof coin.id !== 'string' || typeof coin.current_price !== 'number') {
      throw new Error(`Invalid coin data received for: ${coin.id ?? 'unknown'}`);
    }

    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h ?? 0,
      market_cap: coin.market_cap ?? 0,
      sparkline_in_7d: {
        price: coin.sparkline_in_7d?.price ?? [],
      },
      image: coin.image ?? '',
    };
  });
}

// Fetches the current trending coin IDs from CoinGecko, then reuses
// fetchCoinsByIds to get full market data for exactly those coins.
async function fetchTrendingCoins(): Promise<CoinPrice[]> {
  const trendingUrl = `${COINGECKO_BASE}/search/trending`;

  const trendingRes = await fetch(trendingUrl, {
    headers: {
      'x-cg-api-key': process.env.COINGECKO_API_KEY ?? '',
      'Accept': 'application/json',
    },
    // Trending list changes slowly — cache longer than live prices
    next: { revalidate: 300 },
  });

  if (!trendingRes.ok) {
    throw new Error(`CoinGecko trending responded with status ${trendingRes.status}`);
  }

  const trendingData = await trendingRes.json();

  if (!Array.isArray(trendingData?.coins)) {
    throw new Error('Unexpected response shape from CoinGecko trending');
  }

  const trendingIds: string[] = trendingData.coins
    .map((entry: any) => entry?.item?.id)
    .filter((id: unknown): id is string => typeof id === 'string');

  if (trendingIds.length === 0) {
    return [];
  }

  return fetchCoinsByIds(trendingIds.join(','));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');
  const trending = searchParams.get('trending');

  if (!ids && trending !== 'true') {
    return NextResponse.json(
      { error: 'Missing required query parameter: ids (or pass trending=true)' },
      { status: 400 }
    );
  }

  try {
    const coins = trending === 'true'
      ? await fetchTrendingCoins()
      : await fetchCoinsByIds(ids!);

    return NextResponse.json(coins);

  } catch (error) {
    console.error('[/api/coins] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}