export interface NewsArticle {
  title: string;
  url: string;
  publishedAt: string; // ISO 8601, e.g. "2025-06-28T14:30:00Z"
  description: string;
  source: "CoinDesk" | "CoinTelegraph";
}