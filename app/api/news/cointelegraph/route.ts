import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { NewsArticle } from "@/types/news";

export const runtime = "nodejs";
export const revalidate = 300;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL("https://cointelegraph.com/rss");

    const articles: NewsArticle[] = feed.items
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: stripHtml(item.title ?? ""),
        url: item.link ?? "",
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        description: stripHtml(
          item.contentSnippet ?? item.content ?? item.summary ?? ""
        ),
        source: "CoinTelegraph" as const,
      }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error("CoinTelegraph RSS error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CoinTelegraph news" },
      { status: 500 }
    );
  }
}