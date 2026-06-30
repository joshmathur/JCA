export interface CoinPrice {

    id: string;                          // CoinGecko's unique ID e.g. "bitcoin"
  symbol: string;                      // e.g. "btc"
  name: string;                        // e.g. "Bitcoin"
  current_price: number;               // in USD
  price_change_percentage_24h: number; // e.g. 2.45 or -1.12
  market_cap: number;                  // total market cap in USD
  sparkline_in_7d: {
    price: number[];                   // array of ~168 price points (one per hour)
  };
  image: string;                       // URL to coin logo
}

export interface CoinSearchResult {
  id: string;     // CoinGecko ID — this is what we store in the DB
  symbol: string;
  name: string;
  thumb: string;  // small logo URL (CoinGecko's word for it)
  market_cap_rank: number | null;
}