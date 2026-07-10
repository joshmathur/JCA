"use client";

import { useEffect, useState } from "react";
import { NewsArticle } from "@/types/news";
import { CoinPrice } from "@/types/coin";
import { WatchlistEntry } from "@/types/watchlist";
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";

function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch logged-in user's email
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    }
    fetchUser();
  }, []);

  // Fetch watchlist coins + live prices
  useEffect(() => {
    async function fetchWatchlistPrices() {
      try {
        // Step 1: get coin IDs from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from("watchlist")
          .select("coin_id");
        if (error || !data || data.length === 0) {
          setCoinsLoading(false);
          return;
        }

        const ids = (data as Pick<WatchlistEntry, "coin_id">[])
          .map((e) => e.coin_id)
          .join(",");

        // Step 2: fetch live prices from CoinGecko via the existing API route
        const res = await fetch(`/api/coins?ids=${encodeURIComponent(ids)}`);
        if (!res.ok) throw new Error("Failed to fetch prices");
        const priceData: CoinPrice[] = await res.json();
        setCoins(priceData);
      } catch (err) {
        console.error("Dashboard coins error:", err);
      } finally {
        setCoinsLoading(false);
      }
    }
    fetchWatchlistPrices();
  }, []);

  // Fetch latest news
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: NewsArticle[] = await res.json();
        setArticles(data.slice(0, 3));
      } catch (err) {
        console.error("Dashboard news error:", err);
      } finally {
        setNewsLoading(false);
      }
    }
    fetchNews();
  }, []);

 return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      {userEmail && (
        <p className="text-sm text-gray-400 mb-6">
          Welcome back, {userEmail}
        </p>
      )}
      {!userEmail && <div className="mb-6" />}

      {/* Watchlist Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Watchlist</h2>
          <Link
            href="/watchlist"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Manage →
          </Link>
        </div>

        {coinsLoading && (
          <div className="text-gray-400 text-sm">Loading prices...</div>
        )}

        {!coinsLoading && coins.length === 0 && (
          <div className="text-gray-400 text-sm">
            No coins in your watchlist yet.{" "}
            <Link href="/watchlist" className="text-blue-400 hover:underline">
              Add some →
            </Link>
          </div>
        )}

        {!coinsLoading && coins.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {coins.map((coin) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              return (
                <div
                  key={coin.id}
                  className="bg-gray-700 rounded-lg p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-white text-sm font-medium">
                      {coin.symbol.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white font-semibold text-base">
                    ${coin.current_price.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? "▲" : "▼"}{" "}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Latest News */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Latest News</h2>
          <Link
            href="/news"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        {newsLoading && (
          <div className="text-gray-400 text-sm">Loading news...</div>
        )}

        {!newsLoading && articles.length === 0 && (
          <div className="text-gray-400 text-sm">No articles available.</div>
        )}

        {!newsLoading && articles.length > 0 && (
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <span
                  className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    article.source === "CoinDesk"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-orange-900 text-orange-300"
                  }`}
                >
                  {article.source}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  <span className="text-gray-500 text-xs">
                    {timeAgo(article.publishedAt)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}