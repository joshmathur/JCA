"use client";

import { useEffect, useState } from "react";
import { NewsArticle } from "@/types/news";
import { CoinPrice } from "@/types/coin";
import { WatchlistEntry } from "@/types/watchlist";
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Star, Newspaper } from "lucide-react";

function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const coinGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const coinItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

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
    <div className="mx-auto max-w-4xl">
      {/* Welcome */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 h-5 text-sm text-muted-foreground">
          {userEmail ? <>Welcome back, <span className="text-foreground/80">{userEmail}</span></> : null}
        </p>
      </motion.header>

      {/* Watchlist Summary */}
      <motion.section
        custom={0}
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="surface-grain mb-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-forest"
      >
        <PanelHeader icon={Star} title="My Watchlist" href="/watchlist" cta="Manage" />

        {coinsLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        )}

        {!coinsLoading && coins.length === 0 && (
          <EmptyState>
            No coins in your watchlist yet.{" "}
            <Link href="/watchlist" className="font-medium text-primary hover:underline">
              Add some →
            </Link>
          </EmptyState>
        )}

        {!coinsLoading && coins.length > 0 && (
          <motion.div
            variants={coinGrid}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {coins.map((coin) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              return (
                <motion.div
                  key={coin.id}
                  variants={coinItem}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex flex-col gap-1 rounded-2xl border border-border/50 bg-background/40 p-3.5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coin.image} alt={coin.name} className="size-5 rounded-full" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {coin.symbol.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    ${coin.current_price.toLocaleString()}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                      isPositive ? "text-positive" : "text-negative"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.section>

      {/* Latest News */}
      <motion.section
        custom={1}
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="surface-grain rounded-3xl border border-border/70 bg-card/80 p-6 shadow-forest"
      >
        <PanelHeader icon={Newspaper} title="Latest News" href="/news" cta="View all" />

        {newsLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        )}

        {!newsLoading && articles.length === 0 && (
          <EmptyState>No articles available.</EmptyState>
        )}

        {!newsLoading && articles.length > 0 && (
          <div className="flex flex-col">
            {articles.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group -mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-accent/30"
              >
                <SourceBadge source={article.source} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
                    {article.title}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    {timeAgo(article.publishedAt)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}

/* --------------------------------------------------------------- primitives */

function PanelHeader({
  icon: Icon,
  title,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-accent/50 text-primary ring-1 ring-inset ring-border/60">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isCoinDesk = source === "CoinDesk";
  return (
    <span
      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isCoinDesk
          ? "bg-primary/12 text-primary ring-primary/25"
          : "bg-[#c2a878]/12 text-[#c2a878] ring-[#c2a878]/25"
      }`}
    >
      {source}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}
