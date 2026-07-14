import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { CoinPrice } from '@/types/coin';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BROAD_BATCH_SIZE = 250;
const REVALIDATE_SECONDS = 30;

// Service-role client: only ever used server-side, never sent to the client.
// Bypasses RLS, which is correct here — this code is the trusted writer.

async function fetchMarketsFromCoinGecko(params: Record<string, string>) {
  const url = new URL(`${COINGECKO_BASE}/coins/markets`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'x-cg-demo-api-key': process.env.COINGECKO_API_KEY ?? '',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`CoinGecko responded with status ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response shape from CoinGecko');
  return data;
}

function toCoinPrice(coin: any): CoinPrice | null {
  if (typeof coin.id !== 'string' || typeof coin.current_price !== 'number') return null;
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    current_price: coin.current_price,
    price_change_percentage_24h: coin.price_change_percentage_24h ?? 0,
    market_cap: coin.market_cap ?? 0,
    sparkline_in_7d: { price: coin.sparkline_in_7d?.price ?? [] },
    image: coin.image ?? '',
  };
}

async function upsertCoins(supabase: SupabaseClient, coins: CoinPrice[]) {
  if (coins.length === 0) return;
  const rows = coins.map((c) => ({
    coin_id: c.id,
    data: c,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('coin_price_cache').upsert(rows, { onConflict: 'coin_id' });
  if (error) console.error('[coinCache] upsert failed:', error.message);
}

// Refreshes the broad batch if it's stale. Uses an atomic conditional
// update as a claim lock: only the request that successfully flips
// updated_at while it's still old actually does the CoinGecko call.
// Everyone else (recent refresh, or a refresh already in flight) skips.
async function refreshBroadBatchIfStale(supabase: SupabaseClient) {
  const staleBefore = new Date(Date.now() - REVALIDATE_SECONDS * 1000).toISOString();

  const { data: claimed, error } = await supabase
    .from('cache_meta')
    .update({ updated_at: new Date().toISOString() })
    .eq('key', 'broad_batch')
    .lt('updated_at', staleBefore)
    .select();

  if (error) {
    console.error('[coinCache] lock claim failed:', error.message);
    return;
  }
  if (!claimed || claimed.length === 0) return; // someone else has this covered

  try {
    const raw = await fetchMarketsFromCoinGecko({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: String(BROAD_BATCH_SIZE),
      page: '1',
      sparkline: 'true',
      price_change_percentage: '24h',
    });
    const coins = raw.map(toCoinPrice).filter((c): c is CoinPrice => c !== null);
    await upsertCoins(supabase, coins);
  } catch (err) {
    // Leave old cached data in place — the lock will look stale again
    // on the next request, so this naturally retries.
    console.error('[coinCache] broad batch refresh failed:', err);
  }
}

// Public entry point. Returns CoinPrice[] for exactly the requested ids,
// in the order requested, sourced from the shared cache where possible
// and gap-filled with a single targeted call for anything missing.
export async function getCoinPrices(ids: string[]): Promise<CoinPrice[]> {
  if (ids.length === 0) return [];
  const supabase = createAdminClient();

  await refreshBroadBatchIfStale(supabase);

  const staleThreshold = new Date(Date.now() - REVALIDATE_SECONDS * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from('coin_price_cache')
    .select('coin_id, data, updated_at')
    .in('coin_id', ids);

  if (error) throw new Error(`Supabase read failed: ${error.message}`);

  const found = new Map<string, CoinPrice>();
  const candidates: string[] = []; // missing, or present-but-stale

  for (const id of ids) {
    const row = rows?.find((r) => r.coin_id === id);
    if (!row) {
      candidates.push(id);
      continue;
    }
    // Seed with whatever we have now, even if it turns out stale below.
    // This is what makes the fallback below "free" — no separate lookup.
    found.set(id, row.data as CoinPrice);
    if (row.updated_at < staleThreshold) {
      candidates.push(id);
    }
  }

  if (candidates.length > 0) {
    try {
      const raw = await fetchMarketsFromCoinGecko({
        vs_currency: 'usd',
        ids: candidates.join(','),
        order: 'market_cap_desc',
        sparkline: 'true',
        price_change_percentage: '24h',
      });
      const freshCoins = raw.map(toCoinPrice).filter((c): c is CoinPrice => c !== null);
      await upsertCoins(supabase, freshCoins);
      freshCoins.forEach((c) => found.set(c.id, c)); // fresh overwrites stale
    } catch (err) {
      // Stale-while-revalidate: the refresh failed (rate limit, network,
      // etc). `found` already holds last-known-good data for anything
      // that merely needed refreshing, so we just don't overwrite it —
      // the caller gets slightly-old prices instead of an error.
      console.error('[coinCache] refresh failed, serving stale data where available:', err);
    }
  }

  return ids.map((id) => found.get(id)).filter((c): c is CoinPrice => !!c);
}