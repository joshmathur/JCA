export const runtime = "nodejs";
import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { NewsArticle } from "@/types/news";

// Tell Next.js to cache this route's response for 5 minutes
export const revalidate = 300;

// Strips HTML tags from a string — RSS feeds sometimes include raw HTML in descriptions
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(
      "https://www.coindesk.com/arc/outboundfeeds/rss/"
    );

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
        source: "CoinDesk" as const,
      }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error("CoinDesk RSS error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CoinDesk news" },
      { status: 500 }
    );
  }
}