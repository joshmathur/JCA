import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NewWatchlistEntry, WatchlistEntry } from '@/types/watchlist';

// GET /api/watchlist - returns all coins in the watchlist
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data as WatchlistEntry[]);

  } catch (error) {
    console.error('[GET /api/watchlist] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/watchlist - adds a coin to the watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { coin_id, symbol, name } = body;

    if (
      typeof coin_id !== 'string' || !coin_id.trim() ||
      typeof symbol !== 'string' || !symbol.trim() ||
      typeof name !== 'string' || !name.trim()
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: coin_id, symbol, and name are required' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('coin_id', coin_id.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This coin is already in your watchlist' },
        { status: 409 }
      );
    }

    const newEntry: NewWatchlistEntry = {
      coin_id: coin_id.trim(),
      symbol: symbol.trim().toLowerCase(),
      name: name.trim(),
    };

    const { data, error } = await supabase
      .from('watchlist')
      .insert(newEntry)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data as WatchlistEntry, { status: 201 });

  } catch (error) {
    console.error('[POST /api/watchlist] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add coin to watchlist' },
      { status: 500 }
    );
  }
}
