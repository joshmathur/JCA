// app/api/coins/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { CoinPrice } from '@/types/coin';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function GET(request: NextRequest) {
  // 1. Read which coins to fetch from the query string
  //    e.g. /api/coins?ids=bitcoin,ethereum
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json(
      { error: 'Missing required query parameter: ids' },
      { status: 400 }
    );
  }

  try {
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
      // Tell Next.js to cache this response for 30 seconds
      // so we don't hammer CoinGecko on every request
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko responded with status ${response.status}`);
    }

    const data = await response.json();

    // 2. Validate the shape before we trust it
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response shape from CoinGecko');
    }

    // 3. Transform + whitelist only the fields we actually need
    const coins: CoinPrice[] = data.map((coin: any) => {
      // Guard: if a coin is missing critical fields, something is wrong
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

    return NextResponse.json(coins);

  } catch (error) {
    console.error('[/api/coins] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}