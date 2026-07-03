import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAndSavePicks } from '@/lib/generatePicks';

// GET /api/ai/picks - returns the most recently saved picks (used by the
// Picks page on load — cheap read, no auth needed)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/ai/picks] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved picks' }, { status: 500 });
  }
}

// POST /api/ai/picks - manually triggers pick generation.
// DEV/TESTING TOOL ONLY — remove or gate this behind auth before production,
// once the cron job (app/api/cron/picks) is confirmed working. See Part 4 summary.
export async function POST() {
  try {
    const result = await generateAndSavePicks();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/ai/picks] Error:', error);
    return NextResponse.json({ error: 'Failed to generate picks' }, { status: 500 });
  }
}