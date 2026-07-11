"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
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

const MODES = [
  { key: "my-coins" as const, label: "My Coins" },
  { key: "all" as const, label: "All Crypto News" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"my-coins" | "all">("my-coins");
  const [watchlistCoins, setWatchlistCoins] = useState<string[]>([]);

  // Fetch the user's watchlist coin names from Supabase
  useEffect(() => {
    async function loadWatchlist() {
      const supabase = createClient();
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Crypto News
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The latest from CoinDesk and CoinTelegraph.
          </p>
        </div>

        {/* Segmented toggle with a sliding indicator */}
        <div className="inline-flex rounded-full border border-border/70 bg-card/60 p-1">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="news-toggle"
                    className="absolute inset-0 rounded-full bg-primary shadow-forest"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty watchlist warning */}
      <AnimatePresence>
        {mode === "my-coins" && watchlistCoins.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#c2a878]/40 bg-[#c2a878]/10 px-4 py-3 text-sm text-[#d8be93]">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Your watchlist is empty — showing all news instead. Add coins to
                your watchlist to filter news to your portfolio.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-2xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-[#d98b76]">
          {error}
        </div>
      )}

      {/* Content — crossfades between modes/states */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </motion.div>
        ) : articles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-sm text-muted-foreground"
          >
            No articles found for your coins. Try switching to All Crypto News.
          </motion.div>
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            {articles.map((article, i) => {
              const isCoinDesk = article.source === "CoinDesk";
              return (
                <motion.a
                  key={article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}
                  className="surface-grain block rounded-2xl border border-border/70 bg-card/80 p-5 shadow-forest transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        isCoinDesk
                          ? "bg-primary/12 text-primary ring-primary/25"
                          : "bg-[#c2a878]/12 text-[#c2a878] ring-[#c2a878]/25"
                      }`}
                    >
                      {article.source}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {timeAgo(article.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mb-1 text-base font-semibold leading-snug text-foreground">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {article.description}
                    </p>
                  )}
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
