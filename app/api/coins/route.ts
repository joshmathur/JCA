import { NextRequest, NextResponse } from 'next/server';
import { getCoinPrices } from '@/lib/coinCache';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Trending list changes slowly and is the same for every user (no
// per-user params), so it still benefits from a plain Next.js fetch
// cache — no need to route this part through Supabase.
async function fetchTrendingIds(): Promise<string[]> {
  const res = await fetch(`${COINGECKO_BASE}/search/trending`, {
    headers: {
      'x-cg-demo-api-key': process.env.COINGECKO_API_KEY ?? '',
      'Accept': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`CoinGecko trending responded with status ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.coins)) throw new Error('Unexpected response shape from CoinGecko trending');

  return data.coins
    .map((entry: any) => entry?.item?.id)
    .filter((id: unknown): id is string => typeof id === 'string');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  const trending = searchParams.get('trending');

  if (!idsParam && trending !== 'true') {
    return NextResponse.json(
      { error: 'Missing required query parameter: ids (or pass trending=true)' },
      { status: 400 }
    );
  }

  try {
    const ids = trending === 'true'
      ? await fetchTrendingIds()
      : idsParam!.split(',').map((s) => s.trim()).filter(Boolean);

    const coins = await getCoinPrices(ids);
    return NextResponse.json(coins);

  } catch (error) {
    console.error('[/api/coins] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch coin data' }, { status: 500 });
  }
}