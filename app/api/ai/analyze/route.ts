import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { CoinPrice } from '@/types/coin';
import { NewsArticle } from '@/types/news';
import { AIAnalysis } from '@/types/analysis';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getBaseUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
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

function isValidAnalysis(obj: any): obj is AIAnalysis {
  return (
    obj &&
    typeof obj.entryZone === 'string' &&
    typeof obj.exitZone === 'string' &&
    typeof obj.stopLoss === 'string' &&
    typeof obj.reasoning === 'string' &&
    typeof obj.newsBased === 'boolean' &&
    Array.isArray(obj.citedArticles) &&
    obj.citedArticles.every(
      (a: any) => a && typeof a.title === 'string' && typeof a.url === 'string'
    ) &&
    ['low', 'medium', 'high'].includes(obj.confidence) &&
    ['favorable', 'neutral', 'unfavorable'].includes(obj.outlook)
  );
}

const PRICE_RANGE_PATTERN = /^\$[\d,]+(?:\.\d+)?\s*[-–—]\s*\$[\d,]+(?:\.\d+)?$/;

function hasValidPriceFormat(analysis: AIAnalysis): boolean {
  // When outlook is "unfavorable" these three fields get force-overwritten
  // to a fixed N/A string right after this runs anyway (see below) — so
  // there's nothing meaningful to check in that branch.
  if (analysis.outlook === 'unfavorable') return true;

  return (
    PRICE_RANGE_PATTERN.test(analysis.entryZone.trim()) &&
    PRICE_RANGE_PATTERN.test(analysis.exitZone.trim()) &&
    PRICE_RANGE_PATTERN.test(analysis.stopLoss.trim())
  );
}

class AnalysisFormatError extends Error {}

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { coin_id } = body;

    if (typeof coin_id !== 'string' || !coin_id.trim()) {
      return NextResponse.json({ error: 'coin_id is required' }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    // 1. Live price data
    const priceRes = await fetch(`${baseUrl}/api/coins?ids=${encodeURIComponent(coin_id)}`);
    if (!priceRes.ok) throw new Error('Failed to fetch price data');
    const priceData: CoinPrice[] = await priceRes.json();
    const coin = priceData[0];

    if (!coin) {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }

    const sevenDayChange = calculate7dChange(coin.sparkline_in_7d);

    // 2. Relevant news — may be empty, and that's fine
    const newsRes = await fetch(`${baseUrl}/api/news?coins=${encodeURIComponent(coin_id)}`);
    const newsData: NewsArticle[] = newsRes.ok ? await newsRes.json() : [];
    const hasNews = newsData.length > 0;

    // 3. Build the prompt
    const priceSection = `
Coin: ${coin.name} (${coin.symbol.toUpperCase()})
Current price: $${coin.current_price}
24h change: ${coin.price_change_percentage_24h?.toFixed(2)}%
7d change: ${sevenDayChange !== null ? sevenDayChange.toFixed(2) + '%' : 'unavailable'}
Market cap: $${coin.market_cap?.toLocaleString()}
`.trim();

    // Now includes the URL so Claude can actually cite it
    const newsSection = hasNews
      ? `\n\nRecent articles (only cite ones genuinely relevant to this coin's price action or outlook):\n${newsData
          .slice(0, 5)
          .map((a) => `- Title: "${a.title}" | Source: ${a.source} | URL: ${a.url}`)
          .join('\n')}`
      : '';

    const userMessage = `${priceSection}${newsSection}`;

    const systemPrompt = `You are a crypto market analyst for a personal trading assistant tool. Given price data (and news, if provided) for a single cryptocurrency, respond with ONLY a JSON object matching this exact shape — no preamble, no markdown formatting, no text outside the JSON:

{
  "reasoning": string,
  "outlook": "favorable" | "neutral" | "unfavorable",
  "entryZone": string,
  "exitZone": string,
  "stopLoss": string,
  "newsBased": boolean,
  "citedArticles": [{ "title": string, "url": string }],
  "confidence": "low" | "medium" | "high"
}

Fill the fields in the order shown: work out your reasoning first, then commit to an outlook, then the price zones, and only decide confidence last, once everything above is written.

Rules:
- entryZone, exitZone, and stopLoss must contain ONLY a price range in the exact format "$X–$Y" — nothing else. No qualifiers, no conditions, no explanation, no words at all besides the two dollar amounts and the dash between them. Any reasoning, caveats, or conditions belong in the reasoning field, never in these three fields.
  - CORRECT entryZone: "$62,000–$64,000"
  - CORRECT stopLoss: "$59,000–$59,500"
  - INCORRECT: "Around $62,000–$64,000 if support holds" (extra words attached to an otherwise valid range)
  - INCORRECT: "Wait for a pullback before entering" (no numbers at all)
  - The one exception: when outlook is "unfavorable", these three fields must be the fixed phrase "N/A — no position recommended" as specified below — that exact phrase is the only non-numeric value ever allowed here.
- Be honest about downside risk. If the data suggests this is not currently a good entry — a clear downtrend, no reversal signal, poor risk/reward, negative news — set outlook to "unfavorable" and say so plainly in reasoning. Do not default to "favorable" or soften a bad setup. Recommending caution or avoidance is a valid, expected outcome, not a failure.
- When outlook is "unfavorable", there is no recommended position, so entryZone, exitZone, and stopLoss must all say "N/A — no position recommended" (or a close variant). Never give a concrete exit or stop-loss price when you are not recommending an entry — that produces a contradictory recommendation.
- For confidence, decide by testing "high" and "low" FIRST, and only fall to "medium" if the setup fits neither. "medium" is NOT a safe default for "unsure" — it must be earned by the criteria below.
  - "high": the available signals independently agree. Test: the 24h and 7d changes point the same direction AND news is either absent or clearly corroborates that move. There is no signal pointing the other way. (e.g. 7d +18%, 24h +4%, and a relevant article about a positive catalyst → "high".)
  - "low": the signals conflict, or the data is too sparse to read. Test: the 24h and 7d changes point in opposite directions, OR relevant news contradicts the price action, OR 7d data is unavailable and 24h is near-flat. (e.g. 7d -12% but 24h +6%, or 7d unavailable and 24h at +0.3% → "low".)
  - "medium": choose ONLY when neither test above is met — the direction is consistent but weak or small in magnitude, or one supporting signal is simply missing (not contradicting). (e.g. 7d +3%, 24h +0.5%, no news → "medium".) If you find yourself picking "medium" because you are hedging rather than because it matched this criterion, re-read the "high" and "low" tests and pick one of them.
- Only set newsBased to true if at least one provided article is genuinely relevant to this coin's near-term price action or outlook. A non-empty article list does not by itself mean newsBased should be true.
- If newsBased is true, list every article you relied on in citedArticles, reproducing its exact title and URL from the provided list. If newsBased is false, citedArticles must be an empty array.
- If an article was provided but is not relevant, treat it as if it were never given to you: do not mention it, summarize it, or explain why it was dismissed anywhere in reasoning. Irrelevant articles should leave no trace in your response.
- Never invent, imply, or cite news that wasn't provided to you.
- reasoning should be 1-3 plain-English sentences a non-expert could understand.
- This is not financial advice and should read as an informed observation, not a directive.`;

   async function requestAnalysis(): Promise<AIAnalysis> {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: '{' },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new AnalysisFormatError('No text response from Claude');
      }

      const rawJson = '{' + textBlock.text;

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError) {
        throw new AnalysisFormatError(`Unparseable JSON: ${parseError}`);
      }

      if (!isValidAnalysis(parsed)) {
        throw new AnalysisFormatError(`Invalid analysis shape: ${JSON.stringify(parsed)}`);
      }

      if (!hasValidPriceFormat(parsed)) {
        throw new AnalysisFormatError(
          `Price fields not in expected format: entryZone="${parsed.entryZone}" exitZone="${parsed.exitZone}" stopLoss="${parsed.stopLoss}"`
        );
      }

      if (parsed.outlook === 'unfavorable') {
        parsed.entryZone = 'N/A — no position recommended';
        parsed.exitZone = 'N/A — no position recommended';
        parsed.stopLoss = 'N/A — no position recommended';
      }

      return parsed;
    }

    // 4. Call Claude, retrying once if the response fails validation.
    // The prompt makes correct output the strong default, not a guarantee —
    // this is the enforcement backstop for whatever slips through anyway.
    let analysis: AIAnalysis;
    try {
      analysis = await requestAnalysis();
    } catch (firstError) {
      console.warn('[POST /api/ai/analyze] First attempt failed validation, retrying once:', firstError);
      try {
        analysis = await requestAnalysis();
      } catch (secondError) {
        console.error('[POST /api/ai/analyze] Retry also failed:', secondError);
        return NextResponse.json(
          { error: 'Claude returned an unexpected response shape. Please try again.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('[POST /api/ai/analyze] Error:', error);
    return NextResponse.json({ error: 'Failed to analyze coin' }, { status: 500 });
  }
}