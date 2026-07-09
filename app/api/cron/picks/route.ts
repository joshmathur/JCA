import { NextRequest, NextResponse } from 'next/server';
import { generateAndSavePicks } from '@/lib/generatePicks';
// GET /api/cron/picks - triggered daily by Vercel Cron once deployed
// (vercel.json schedule added in Part 5). Secured with CRON_SECRET so only
// Vercel's scheduler can trigger this — this route makes paid Claude API calls.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateAndSavePicks();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/cron/picks] Error:', error);
    return NextResponse.json({ error: 'Failed to generate picks' }, { status: 500 });
  }
}