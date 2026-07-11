'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Loader2, X, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CoinSearchResult, CoinPrice } from '@/types/coin';
import { WatchlistEntry } from '@/types/watchlist';
import { AIAnalysis } from '@/types/analysis';
import {
  AnalysisThinking,
  AnalysisError,
  AnalysisResult,
} from '@/components/analysis/AnalysisCard';

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

  // Completed AI analyses, keyed by coin_id
  const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});

  // Coin_ids currently being analyzed — a Set so multiple cards can be
  // analyzing at once without stepping on each other's loading state
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  // Error messages from failed analysis calls, keyed by coin_id
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({});

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

  // Called when the user clicks "Analyze" on a coin card
  const handleAnalyze = async (coinId: string) => {
    setAnalyzingIds((prev) => new Set(prev).add(coinId));

    // Clear any previous error for this coin before retrying
    setAnalysisErrors((prev) => {
      const next = { ...prev };
      delete next[coinId];
      return next;
    });

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin_id: coinId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalyses((prev) => ({ ...prev, [coinId]: data as AIAnalysis }));
    } catch (error) {
      console.error('Analyze error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setAnalysisErrors((prev) => ({ ...prev, [coinId]: message }));
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(coinId);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Watchlist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track live prices and pull AI analysis on the coins you follow.
        </p>
      </header>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search for a coin (e.g. bitcoin, sol)…"
          className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-10 pr-10 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-card/90 focus:ring-2 focus:ring-primary/25"
        />
        {isSearching && (
          <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground/70" />
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="surface-grain mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-forest backdrop-blur-sm"
          >
            {searchResults.map((coin, i) => (
              <div
                key={coin.id}
                className={`flex items-center justify-between p-3 transition-colors hover:bg-accent/30 ${
                  i > 0 ? 'border-t border-border/40' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {coin.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coin.thumb} alt={coin.name} className="size-7 rounded-full" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{coin.name}</p>
                    <p className="text-xs uppercase text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => handleAddCoin(coin)}
                  disabled={addingCoinId === coin.id}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-50"
                >
                  {addingCoinId === coin.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  Add
                </motion.button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist grid */}
      {isLoadingWatchlist ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted/40" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-sm text-muted-foreground">
          Your watchlist is empty. Search for a coin above to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {watchlist.map((entry) => {
              const price = prices[entry.coin_id];
              const isPositive = (price?.price_change_percentage_24h ?? 0) >= 0;
              const analysis = analyses[entry.coin_id];
              const isAnalyzing = analyzingIds.has(entry.coin_id);
              const analysisError = analysisErrors[entry.coin_id];

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  whileHover={{ y: -4 }}
                  className="surface-grain group relative rounded-3xl border border-border/70 bg-card/80 p-5 shadow-forest transition-colors hover:border-primary/40"
                >
                  <button
                    onClick={() => handleRemoveCoin(entry)}
                    disabled={removingId === entry.id}
                    className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/60 opacity-0 transition-all hover:bg-negative/15 hover:text-[#d98b76] group-hover:opacity-100 disabled:opacity-50"
                    aria-label={`Remove ${entry.name}`}
                  >
                    {removingId === entry.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </button>

                  <div className="mb-3 flex items-center gap-2.5">
                    {price?.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={price.image} alt={entry.name} className="size-8 rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                      <p className="text-xs uppercase text-muted-foreground">{entry.symbol}</p>
                    </div>
                  </div>

                  {price ? (
                    <>
                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        ${price.current_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: price.current_price < 1 ? 6 : 2,
                        })}
                      </p>
                      <div
                        className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${
                          isPositive ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownRight className="size-4" />
                        )}
                        {price.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Price unavailable</p>
                  )}

                  {/* Analyze button */}
                  <motion.button
                    onClick={() => handleAnalyze(entry.coin_id)}
                    disabled={isAnalyzing}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5 text-primary" />
                        {analysis ? 'Re-analyze' : 'Analyze'}
                      </>
                    )}
                  </motion.button>

                  {/* Analysis states */}
                  {isAnalyzing && !analysis && <AnalysisThinking />}
                  {analysisError && <AnalysisError message={analysisError} />}
                  {analysis && !isAnalyzing && <AnalysisResult analysis={analysis} />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
