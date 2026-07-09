import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { CoinPrice } from '@/types/coin';
import { NewsArticle } from '@/types/news';
import { Pick, PicksResponse } from '@/types/picks';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MIN_MARKET_CAP = 50_000_000; // $50M floor — excludes micro-cap/meme spikes

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function extractSparklinePrices(sparkline: unknown): number[] {
  if (Array.isArray(sparkline)) return sparkline as number[];
  if (
    sparkline &&
    typeof sparkline === 'object' &&
    Array.isArray((sparkline as any).price)
  ) {
    return (sparkline as any).price;
  }
  return [];
}

function calculate7dChange(sparkline: unknown): number | null {
  const prices = extractSparklinePrices(sparkline);
  if (prices.length < 2) return null;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (!first) return null;
  return ((last - first) / first) * 100;
}

function isValidPicksResponse(obj: any): obj is PicksResponse {
  return (
    obj &&
    Array.isArray(obj.picks) &&
    obj.picks.every(
      (p: any) =>
        p &&
        typeof p.coinId === 'string' &&
        typeof p.symbol === 'string' &&
        typeof p.name === 'string' &&
        typeof p.reason === 'string' &&
        ['low', 'medium', 'high'].includes(p.confidence)
    ) &&
    typeof obj.summary === 'string'
  );
}

// Fetches trending candidates, filters by market cap, pulls general news,
// asks Claude to select today's standout picks, and writes them to Supabase
// (replacing prior picks only if the new batch is non-empty).
// Called by the cron-triggered route only — uses the admin client since
// this runs with no logged-in user and picks are shared, not per-user data.
export async function generateAndSavePicks(): Promise<PicksResponse> {
  const supabase = createAdminClient();
  const baseUrl = getBaseUrl();

  const trendingRes = await fetch(`${baseUrl}/api/coins?trending=true`);
  if (!trendingRes.ok) throw new Error('Failed to fetch trending coins');
  const trendingCoins: CoinPrice[] = await trendingRes.json();

  const candidates = trendingCoins.filter((coin) => coin.market_cap >= MIN_MARKET_CAP);

  if (candidates.length === 0) {
    return { picks: [], summary: 'No trending coins passed the quality filter today.' };
  }

  const newsRes = await fetch(`${baseUrl}/api/news`);
  const newsData: NewsArticle[] = newsRes.ok ? await newsRes.json() : [];
  const hasNews = newsData.length > 0;

  const candidatesSection = candidates
    .map((coin) => {
      const change7d = calculate7dChange(coin.sparkline_in_7d);
      return `- ${coin.name} (${coin.symbol.toUpperCase()}, id: ${coin.id}): $${coin.current_price}, 24h: ${coin.price_change_percentage_24h.toFixed(2)}%, 7d: ${change7d !== null ? change7d.toFixed(2) + '%' : 'unavailable'}, market cap: $${coin.market_cap.toLocaleString()}`;
    })
    .join('\n');

  const newsSection = hasNews
    ? `\n\nRecent general market news (only reference an article if it is genuinely relevant to one of the candidates above):\n${newsData
        .slice(0, 10)
        .map((a) => `- "${a.title}" (${a.source})`)
        .join('\n')}`
    : '';

  const userMessage = `Trending candidates today:\n${candidatesSection}${newsSection}`;

  const systemPrompt = `You are a crypto market analyst selecting daily standout picks for a personal trading assistant tool. You will be given a list of trending coins (already filtered for a minimum market cap) and general market news. Respond with ONLY a JSON object matching this exact shape — no preamble, no markdown formatting, no text outside the JSON:

{
  "picks": [
    {
      "coinId": string,
      "symbol": string,
      "name": string,
      "reason": string,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "summary": string
}

Rules:
- Select 3-5 standout picks from the candidates — but only ones that genuinely stand out. If fewer than 3 look worth flagging, return fewer. If none look worth flagging today, return an empty picks array. Never pad the list to hit a quota.
- Weigh market cap and volatility as risk signals, not just raw percentage gains — a large 24h/7d gain on a very low market cap coin is a weaker, riskier signal than a smaller gain on an established coin.
- reason should be one plain-English sentence explaining why this coin stands out today.
- Only reference news in a pick's reason if a specific provided article is genuinely relevant to that coin. Never invent, imply, or reference news that wasn't provided. If no article is relevant to a pick, base its reason on price action and market cap only, and do not mention that news was checked or found irrelevant.
- For confidence, use these criteria and do not default to "medium" as a safe choice:
  - "high": strong price action and (if relevant) supporting news, low ambiguity.
  - "medium": positive signal but mixed, moderate, or partially uncertain.
  - "low": speculative or thin signal, include only if still worth flagging.
- summary should be one sentence giving a high-level overview of today's picks, or — if picks is empty — a one-sentence explanation of why nothing stood out today.
- This is not financial advice and should read as an informed observation, not a directive.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '{' },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const rawJson = '{' + textBlock.text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (parseError) {
    console.error('[generateAndSavePicks] JSON parse error:', parseError, rawJson);
    throw new Error('Claude returned an unparseable response');
  }

  if (!isValidPicksResponse(parsed)) {
    console.error('[generateAndSavePicks] Invalid picks shape:', parsed);
    throw new Error('Claude returned an unexpected response shape');
  }

  if (parsed.picks.length > 0) {
    const { error: deleteError } = await supabase
      .from('picks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) throw deleteError;

    const rowsToInsert = parsed.picks.map((pick) => ({
      coin_id: pick.coinId,
      symbol: pick.symbol,
      name: pick.name,
      analysis: { reason: pick.reason, confidence: pick.confidence },
    }));

    const { error: insertError } = await supabase.from('picks').insert(rowsToInsert);
    if (insertError) throw insertError;
  }

  return parsed;
}