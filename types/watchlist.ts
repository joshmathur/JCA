export interface WatchlistEntry {
  id: string;        // UUID from Supabase (auto-generated)
  coin_id: string;   // CoinGecko ID — links this row to live price data
  symbol: string;    // stored so we can display it without an API call
  name: string;
  added_at: string;  // ISO timestamp string from Supabase
}

// This is used when adding a new coin — no id or added_at yet
export type NewWatchlistEntry = Omit<WatchlistEntry, 'id' | 'added_at'>;