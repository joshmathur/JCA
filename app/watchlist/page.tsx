'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { CoinSearchResult, CoinPrice } from '@/types/coin';
import { WatchlistEntry } from '@/types/watchlist';

export default function WatchlistPage() {
  // Holds whatever the user is typing into the search bar
  const [searchQuery, setSearchQuery] = useState('');

  // Holds the results returned from /api/coins/search
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([]);

  // True while a search request is in flight — used to show a spinner
  const [isSearching, setIsSearching] = useState(false);

  // Tracks which coin_id is currently being added (so we can disable just that button)
  const [addingCoinId, setAddingCoinId] = useState<string | null>(null);
   
  // The user's saved watchlist entries (from Supabase, via our API)
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  // Live price data, keyed by coin_id for easy lookup
  // e.g. { bitcoin: {...CoinPrice}, ethereum: {...CoinPrice} }
  const [prices, setPrices] = useState<Record<string, CoinPrice>>({});

  // True while the watchlist itself is first loading
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  // Tracks which entry id is currently being removed
  const [removingId, setRemovingId] = useState<string | null>(null);
 // Runs once when the page first loads, then sets up auto-refresh
  useEffect(() => {
    // Initial load
    fetchWatchlist();

    // Refresh everything every 30 seconds
    const intervalId = setInterval(() => {
      fetchWatchlist();
    }, 30000); // 30000ms = 30 seconds

    // Cleanup: stop the interval if the user navigates away from this page
    return () => clearInterval(intervalId);
  }, []);

  // Called whenever the search input changes
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/coins/search?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) throw new Error('Search request failed');

        const data: CoinSearchResult[] = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Called when the user clicks "Add" on a search result
  const handleAddCoin = async (coin: CoinSearchResult) => {
    setAddingCoinId(coin.id);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin_id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
        }),
      });

      if (res.status === 409) {
        alert('This coin is already in your watchlist.');
        return;
      }

      if (!res.ok) throw new Error('Failed to add coin');

// Clear the search after a successful add
      setSearchQuery('');
      setSearchResults([]);

      // Refresh the watchlist so the new coin appears immediately
      await fetchWatchlist();
    } catch (error) {
      console.error('Add coin error:', error);
      alert('Something went wrong adding this coin. Please try again.');
    } finally {
      setAddingCoinId(null);
    }
  };

  // Fetches the saved watchlist from Supabase (via our API route)
  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');

      const data: WatchlistEntry[] = await res.json();
      setWatchlist(data);

      // If we have coins, fetch their live prices too
      if (data.length > 0) {
        await fetchPrices(data.map((entry) => entry.coin_id));
      } else {
        setPrices({});
      }
    } catch (error) {
      console.error('Fetch watchlist error:', error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  // Fetches live price data for a list of coin IDs
  const fetchPrices = async (coinIds: string[]) => {
    try {
      const idsParam = coinIds.join(',');
      const res = await fetch(`/api/coins?ids=${encodeURIComponent(idsParam)}`);
      if (!res.ok) throw new Error('Failed to fetch prices');

      const data: CoinPrice[] = await res.json();

      // Convert the array into a lookup object keyed by coin id
      // so we can find a coin's price quickly when rendering
      const priceMap: Record<string, CoinPrice> = {};
      data.forEach((coin) => {
        priceMap[coin.id] = coin;
      });

      setPrices(priceMap);
    } catch (error) {
      console.error('Fetch prices error:', error);
    }
  };

  // Called when the user clicks the remove (X) button on a coin card
  const handleRemoveCoin = async (entry: WatchlistEntry) => {
    setRemovingId(entry.id);
    try {
      const res = await fetch(`/api/watchlist/${entry.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove coin');

      // Remove it from local state immediately (no need to refetch everything)
      setWatchlist((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (error) {
      console.error('Remove coin error:', error);
      alert('Something went wrong removing this coin. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Watchlist</h1>

      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search for a coin (e.g. bitcoin, sol)..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg shadow-sm mb-6 divide-y divide-gray-100">
          {searchResults.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {coin.thumb && (
                  <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                )}
                <div>
                  <p className="font-medium text-sm">{coin.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddCoin(coin)}
                disabled={addingCoinId === coin.id}
                className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {addingCoinId === coin.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Add
              </button>
            </div>
          ))}
        </div>
      )}

     {/* Watchlist grid */}
      {isLoadingWatchlist ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading watchlist...
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Your watchlist is empty. Search for a coin above to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {watchlist.map((entry) => {
            const price = prices[entry.coin_id];
            const isPositive = (price?.price_change_percentage_24h ?? 0) >= 0;

            return (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 relative bg-white shadow-sm"
              >
                <button
                  onClick={() => handleRemoveCoin(entry)}
                  disabled={removingId === entry.id}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Remove ${entry.name}`}
                >
                  {removingId === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center gap-2 mb-2">
                  {price?.image && (
                    <img src={price.image} alt={entry.name} className="w-6 h-6 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{entry.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{entry.symbol}</p>
                  </div>
                </div>

                {price ? (
                  <>
                    <p className="text-lg font-bold text-gray-900">
                      ${price.current_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: price.current_price < 1 ? 6 : 2,
                      })}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {price.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Price unavailable</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}