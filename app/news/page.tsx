"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { NewsArticle } from "@/types/news";
import { WatchlistEntry } from "@/types/watchlist";

// Converts an ISO date string to "2 hours ago", "3 days ago" etc.
function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"my-coins" | "all">("my-coins");
  const [watchlistCoins, setWatchlistCoins] = useState<string[]>([]);

  // Fetch the user's watchlist coin names from Supabase
  useEffect(() => {
    async function loadWatchlist() {
      const { data, error } = await supabase
        .from("watchlist")
        .select("name");
      if (error) {
        console.error("Watchlist fetch error:", error);
        return;
      }
      const names = (data as Pick<WatchlistEntry, "name">[]).map((entry) =>
        entry.name.toLowerCase()
      );
      setWatchlistCoins(names);
    }
    loadWatchlist();
  }, []);

  // Fetch news based on current mode
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/news";
      if (mode === "my-coins" && watchlistCoins.length > 0) {
        url += `?coins=${watchlistCoins.join(",")}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data: NewsArticle[] = await res.json();
      setArticles(data);
    } catch (err) {
      setError("Failed to load news. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mode, watchlistCoins]);

  // Fetch news when mode or watchlist changes
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Crypto News</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("my-coins")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "my-coins"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            My Coins
          </button>
          <button
            onClick={() => setMode("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            All Crypto News
          </button>
        </div>
      </div>

      {/* Empty watchlist warning */}
      {mode === "my-coins" && watchlistCoins.length === 0 && !loading && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          Your watchlist is empty — showing all news instead. Add coins to your
          watchlist to filter news to your portfolio.
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">Loading news...</div>
        </div>
      )}

      {/* No results */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No articles found for your coins. Try switching to All Crypto News.
        </div>
      )}

      {/* Article cards */}
      {!loading && articles.length > 0 && (
        <div className="flex flex-col gap-4">
          {articles.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    article.source === "CoinDesk"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-orange-900 text-orange-300"
                  }`}
                >
                  {article.source}
                </span>
                <span className="text-xs text-gray-500">
                  {timeAgo(article.publishedAt)}
                </span>
              </div>
              <h2 className="text-white font-semibold text-base mb-1 leading-snug">
                {article.title}
              </h2>
              {article.description && (
                <p className="text-gray-400 text-sm line-clamp-2">
                  {article.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}