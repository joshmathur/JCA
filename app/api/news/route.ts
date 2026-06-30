import { NextRequest, NextResponse } from "next/server";
import { NewsArticle } from "@/types/news";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinsParam = searchParams.get("coins"); // e.g. "bitcoin,ethereum"
    const coinFilters = coinsParam
      ? coinsParam.toLowerCase().split(",").map((c) => c.trim())
      : [];

    // Fetch both sources in parallel — faster than one after the other
    const baseUrl = request.nextUrl.origin;
    const [coinDeskRes, coinTelegraphRes] = await Promise.all([
      fetch(`${baseUrl}/api/news/coindesk`),
      fetch(`${baseUrl}/api/news/cointelegraph`),
    ]);

    const [coinDeskArticles, coinTelegraphArticles]: [
      NewsArticle[],
      NewsArticle[]
    ] = await Promise.all([coinDeskRes.json(), coinTelegraphRes.json()]);

    // Merge both arrays together
    const allArticles = [...coinDeskArticles, ...coinTelegraphArticles];

    // Deduplicate by URL — if two articles share the same URL, keep only the first
    const seen = new Map<string, NewsArticle>();
    for (const article of allArticles) {
      if (!seen.has(article.url)) {
        seen.set(article.url, article);
      }
    }
    const deduplicated = Array.from(seen.values());

    // Sort newest first
    const sorted = deduplicated.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // If coin filters were provided, only return articles mentioning those coins
    const filtered =
      coinFilters.length > 0
        ? sorted.filter((article) => {
            const text =
              `${article.title} ${article.description}`.toLowerCase();
            return coinFilters.some((coin) => text.includes(coin));
          })
        : sorted;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Combined news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}